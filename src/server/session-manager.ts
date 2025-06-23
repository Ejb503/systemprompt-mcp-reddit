import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerServerForSession, unregisterServerForSession } from './mcp-server';
import { SessionConfig } from './types';

interface SessionData {
  transport: StreamableHTTPServerTransport;
  server: Server;
  createdAt: Date;
  lastAccessedAt: Date;
  timeoutId: NodeJS.Timeout;
}

/**
 * Manages MCP session lifecycle with automatic cleanup and resource management
 */
export class SessionManager {
  private sessions = new Map<string, SessionData>();
  private readonly options: Required<SessionConfig>;

  constructor(options: SessionConfig) {
    this.options = {
      maxSessions: 1000,
      onSessionExpired: () => {},
      ...options,
    };
  }

  /**
   * Register a new session with automatic cleanup
   */
  registerSession(sessionId: string, transport: StreamableHTTPServerTransport, server: Server): void {
    // Clean up if at capacity
    if (this.sessions.size >= this.options.maxSessions) {
      this.evictOldestSession();
    }

    // Clear any existing session
    this.cleanupSession(sessionId);

    // Register with global server manager
    registerServerForSession(sessionId, server);

    // Create session data
    const timeoutId = setTimeout(() => this.expireSession(sessionId), this.options.sessionTimeout);
    
    this.sessions.set(sessionId, {
      transport,
      server,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      timeoutId,
    });
  }

  /**
   * Get transport for existing session
   */
  getTransport(sessionId: string): StreamableHTTPServerTransport | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Update last accessed and reset timeout
    session.lastAccessedAt = new Date();
    clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => this.expireSession(sessionId), this.options.sessionTimeout);

    return session.transport;
  }

  /**
   * Get active session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session info for monitoring
   */
  getSessionInfo(): Array<{ id: string; createdAt: Date; lastAccessedAt: Date }> {
    return Array.from(this.sessions.entries()).map(([id, data]) => ({
      id,
      createdAt: data.createdAt,
      lastAccessedAt: data.lastAccessedAt,
    }));
  }

  /**
   * Manually expire a session
   */
  expireSession(sessionId: string): void {
    this.cleanupSession(sessionId);
    this.options.onSessionExpired(sessionId);
  }

  /**
   * Clean up all sessions
   */
  cleanup(): void {
    for (const sessionId of this.sessions.keys()) {
      this.cleanupSession(sessionId);
    }
  }

  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    clearTimeout(session.timeoutId);
    unregisterServerForSession(sessionId);
    this.sessions.delete(sessionId);
  }

  private evictOldestSession(): void {
    let oldestId: string | null = null;
    let oldestTime = new Date();

    for (const [id, data] of this.sessions.entries()) {
      if (data.lastAccessedAt < oldestTime) {
        oldestTime = data.lastAccessedAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.expireSession(oldestId);
    }
  }
}