import express from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from './oauth-server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { logger } from '@/utils/logger';
import { rateLimitMiddleware, validateProtocolVersion, requestSizeLimit } from './middleware';
import {
  createMCPServer,
  registerServerForSession,
  unregisterServerForSession,
} from './mcp-server';

// Session configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CORS_HEADERS = 'mcp-session-id, x-session-id';

// Map to track sessions with their server-transport pairs
const sessions = new Map<
  string,
  {
    transport: StreamableHTTPServerTransport;
    server: Server;
    timeoutId: NodeJS.Timeout;
    createdAt: Date;
    lastAccessedAt: Date;
  }
>();

/**
 * Sets up MCP routes with proper session management and transport handling
 */
export function setupMCPRoutes(app: express.Application, authMiddleware?: any): void {
  // Apply middleware stack
  const mcpMiddleware = [
    authMiddleware,
    rateLimitMiddleware(60000, 100), // 100 requests per minute
    validateProtocolVersion,
    requestSizeLimit(10 * 1024 * 1024), // 10MB max
  ].filter(Boolean);

  // Main MCP endpoint
  app.all('/mcp', ...mcpMiddleware, handleMCPRequest);

  // Session monitoring endpoint (optional)
  app.get('/mcp/sessions', authMiddleware, (req, res) => {
    res.json({
      count: sessions.size,
      sessions: Array.from(sessions.entries()).map(([id, data]) => ({
        id,
        createdAt: data.createdAt,
        lastAccessedAt: data.lastAccessedAt,
      })),
    });
  });
}

/**
 * Handles MCP requests with proper error handling and logging
 */
async function handleMCPRequest(req: AuthenticatedRequest, res: express.Response): Promise<void> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Set CORS headers
    res.header('Access-Control-Expose-Headers', CORS_HEADERS);

    // Get session ID from headers
    const sessionId = req.headers['mcp-session-id'] as string;

    // Inject auth context and session ID into request for handlers
    if (req.auth) {
      (req as any).authInfo = req.auth;
    }
    if (sessionId) {
      (req as any).sessionId = sessionId;
    }
    const transport = await getOrCreateTransport(sessionId, req.auth);

    logger.debug('MCP request', {
      requestId,
      sessionId,
      method: req.method,
      hasAuth: !!req.auth,
    });

    // Delegate to transport
    await transport.handleRequest(req, res);

    logger.debug('MCP request completed', {
      requestId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('MCP request failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: { requestId },
        },
        id: null,
      });
    }
  }
}

/**
 * Gets existing transport or creates new session
 */
async function getOrCreateTransport(
  sessionId?: string,
  authInfo?: any,
): Promise<StreamableHTTPServerTransport> {
  // For non-initialization requests, session ID is required
  if (sessionId) {
    const sessionData = sessions.get(sessionId);
    if (sessionData) {
      // Update last accessed and reset timeout
      sessionData.lastAccessedAt = new Date();
      clearTimeout(sessionData.timeoutId);
      sessionData.timeoutId = setTimeout(() => cleanupSession(sessionId), SESSION_TIMEOUT);

      logger.debug('Using existing session', { sessionId });
      return sessionData.transport;
    }

    // Session not found - this is an error for non-initialization requests
    throw new Error(`Session not found: ${sessionId}`);
  }

  // No session ID means this should be an initialization request
  // Authentication is required to create a new session
  if (!authInfo) {
    throw new Error('Authentication required to create new session');
  }

  // Generate session ID first
  const newSessionId = crypto.randomUUID();

  // Create server for this session
  const server = createMCPServer(newSessionId, authInfo);

  // Create transport with the pre-generated session ID
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => newSessionId,
  });

  // Store session data with timeout
  const timeoutId = setTimeout(() => cleanupSession(newSessionId), SESSION_TIMEOUT);
  sessions.set(newSessionId, {
    transport,
    server,
    timeoutId,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
  });

  // Register server for notification routing
  registerServerForSession(newSessionId, server);

  // Connect server to transport
  await server.connect(transport);

  logger.info('New MCP session created', { sessionId: newSessionId });
  return transport;
}

/**
 * Clean up a session
 */
function cleanupSession(sessionId: string): void {
  const sessionData = sessions.get(sessionId);
  if (sessionData) {
    clearTimeout(sessionData.timeoutId);
    sessions.delete(sessionId);
    unregisterServerForSession(sessionId);
    logger.info('Session cleaned up', { sessionId });
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanupMCPSessions(): void {
  logger.info('Cleaning up MCP sessions');
  // Clean up all sessions
  for (const sessionId of sessions.keys()) {
    cleanupSession(sessionId);
  }
}

export function setupUtilityRoutes(app: express.Application): void {
  // Health check
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'reddit-mcp-server',
      transport: 'http',
      capabilities: {
        oauth: true,
        mcp: true,
      },
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    const protocol =
      req.get('x-forwarded-proto') ||
      (req.get('host')?.includes('systemprompt.io') ? 'https' : req.protocol);
    const baseUrl = `${protocol}://${req.get('host')}`;
    const basePath = req.baseUrl || '';
    res.json({
      service: 'Reddit MCP Server',
      version: '1.0.0',
      transport: 'http',
      endpoints: {
        oauth: {
          authorize: `${baseUrl}${basePath}/oauth/authorize`,
          token: `${baseUrl}${basePath}/oauth/token`,
          metadata: `${baseUrl}/.well-known/oauth-authorization-server`,
        },
        mcp: `${baseUrl}${basePath}/mcp`,
        health: `${baseUrl}${basePath}/health`,
      },
    });
  });
}
