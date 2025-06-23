import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CreateMessageRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { serverConfig, serverCapabilities } from '../config/server-config';
import { handleListTools, handleToolCall } from '../handlers/tool-handlers';
import type { MCPHandlerExtra, RedditAuthInfo, MCPToolContext } from '../types/request-context';
import { authStore } from './auth-store';
import { sendSamplingRequest } from '../handlers/sampling';

// Store servers by session for notification routing
const activeServers = new Map<string, Server>();

export function getServer(): Server {
  throw new Error('getServer() is deprecated. Use getServerForSession(sessionId) instead.');
}

// Register a server instance for a session
export function registerServerForSession(sessionId: string, server: Server): void {
  activeServers.set(sessionId, server);
}

// Unregister a server when session ends
export function unregisterServerForSession(sessionId: string): void {
  activeServers.delete(sessionId);
  authStore.removeAuth(sessionId);
}

// Get server for a specific session
export function getServerForSession(sessionId: string): Server | undefined {
  return activeServers.get(sessionId);
}

// Get all active servers (for broadcasting notifications)
export function getAllServers(): Server[] {
  return Array.from(activeServers.values());
}
export function createMCPServer(sessionId: string, authInfo: RedditAuthInfo): Server {
  if (!sessionId) {
    throw new Error('Session ID is required to create MCP server');
  }
  if (!authInfo) {
    throw new Error('Auth info is required to create MCP server');
  }
  authStore.setAuth(sessionId, authInfo);
  const server = new Server(serverConfig, serverCapabilities);
  server.setRequestHandler(ListToolsRequestSchema, handleListTools);
  server.setRequestHandler(CallToolRequestSchema, (request, extra: MCPHandlerExtra) => {
    const context: MCPToolContext = {
      sessionId,
      authInfo,
    };
    return handleToolCall(request, context);
  });
  server.setRequestHandler(CreateMessageRequestSchema, (request, extra: MCPHandlerExtra) => {
    return sendSamplingRequest(request, { sessionId });
  });
  return server;
}

export const mcpServerManager = {
  getServer,
  getServerForSession,
  getAllServers,
  createMCPServer,
  registerServerForSession,
  unregisterServerForSession,
};
