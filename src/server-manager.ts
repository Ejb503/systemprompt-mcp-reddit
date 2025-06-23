/**
 * @file MCP server session management
 * @module server-manager
 * 
 * @remarks
 * This module provides session management for MCP servers in a multi-user
 * environment. It maintains a registry of active MCP server sessions and
 * handles session lifecycle management.
 * 
 * The server manager is essential for:
 * - Supporting multiple concurrent users with separate authentication
 * - Managing server lifecycle per user session
 * - Providing access to the correct server instance for each request
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/architecture} MCP Architecture
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

/**
 * Represents an active MCP session
 * 
 * @remarks
 * Each session contains:
 * - The MCP server instance handling requests
 * - The transport layer for HTTP streaming
 * - Timestamp of last activity for session management
 */
interface MCPSession {
  /** The MCP server instance for this session */
  server: Server;
  /** The HTTP streaming transport for bidirectional communication */
  transport: StreamableHTTPServerTransport;
  /** Timestamp of last activity (for session cleanup) */
  lastUsed: number;
}

/**
 * Manages MCP server sessions for multi-user support
 * 
 * @remarks
 * This singleton class maintains a registry of active MCP sessions,
 * allowing multiple users to connect with their own authentication
 * contexts. It provides methods for:
 * - Registering new sessions
 * - Finding the appropriate server for a request
 * - Cleaning up inactive sessions
 * 
 * The manager tracks the "current" session for convenience in
 * single-user scenarios while supporting multi-user deployments.
 * 
 * @example
 * ```typescript
 * const manager = MCPServerManager.getInstance();
 * manager.registerSession(sessionId, { server, transport, lastUsed: Date.now() });
 * 
 * // Later, get the server for handling requests
 * const server = manager.getActiveServer();
 * ```
 */
class MCPServerManager {
  private static instance: MCPServerManager;
  private sessions = new Map<string, MCPSession>();
  private currentSessionId: string | null = null;

  /**
   * Gets the singleton instance of the server manager
   * 
   * @returns The global MCPServerManager instance
   * 
   * @example
   * ```typescript
   * const manager = MCPServerManager.getInstance();
   * ```
   */
  static getInstance(): MCPServerManager {
    if (!MCPServerManager.instance) {
      MCPServerManager.instance = new MCPServerManager();
    }
    return MCPServerManager.instance;
  }

  /**
   * Registers a new MCP session
   * 
   * @param sessionId - Unique identifier for the session
   * @param session - The session object containing server and transport
   * 
   * @remarks
   * When a new session is registered, it automatically becomes
   * the current session. This is useful for single-user scenarios
   * where the latest session should be active.
   */
  registerSession(sessionId: string, session: MCPSession): void {
    console.log(`📝 Registering MCP session: ${sessionId}`);
    this.sessions.set(sessionId, session);
    // Update the current session to the latest one
    this.currentSessionId = sessionId;
  }

  /**
   * Unregisters an MCP session
   * 
   * @param sessionId - The session ID to remove
   * 
   * @remarks
   * If the removed session was the current session, the manager
   * will automatically select another active session as current.
   */
  unregisterSession(sessionId: string): void {
    console.log(`🗑️ Unregistering MCP session: ${sessionId}`);
    this.sessions.delete(sessionId);
    // If we're removing the current session, find another one
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.sessions.size > 0 ? Array.from(this.sessions.keys())[0] : null;
    }
  }

  /**
   * Gets the active MCP server for handling requests
   * 
   * @returns The active server instance, or null if no sessions exist
   * 
   * @remarks
   * This method implements a fallback strategy:
   * 1. Returns the current session's server if available
   * 2. Falls back to the most recently used session
   * 3. Returns null if no sessions exist
   * 
   * The method also updates the lastUsed timestamp for
   * session activity tracking.
   * 
   * @example
   * ```typescript
   * const server = manager.getActiveServer();
   * if (server) {
   *   // Handle request with server
   * } else {
   *   // No active sessions
   * }
   * ```
   */
  getActiveServer(): Server | null {
    // Return the server for the current session, or the most recently used one
    if (this.currentSessionId && this.sessions.has(this.currentSessionId)) {
      const session = this.sessions.get(this.currentSessionId)!;
      session.lastUsed = Date.now();
      return session.server;
    }
    
    // Fallback: Return the most recently used server
    let mostRecent: MCPSession | null = null;
    for (const session of this.sessions.values()) {
      if (!mostRecent || session.lastUsed > mostRecent.lastUsed) {
        mostRecent = session;
      }
    }
    
    if (mostRecent) {
      mostRecent.lastUsed = Date.now();
      this.currentSessionId = Array.from(this.sessions.entries())
        .find(([, session]) => session === mostRecent)?.[0] || null;
      return mostRecent.server;
    }
    
    return null;
  }

  /**
   * Sets the current active session
   * 
   * @param sessionId - The session ID to make current
   * 
   * @remarks
   * This method allows explicit selection of which session
   * should be considered "current" for request handling.
   * The session must already be registered.
   */
  setCurrentSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      console.log(`🎯 Current session set to: ${sessionId}`);
    }
  }

  /**
   * Gets the number of active sessions
   * 
   * @returns The count of registered sessions
   * 
   * @remarks
   * Useful for monitoring server load and debugging.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

/**
 * Global server manager instance
 * 
 * @remarks
 * This is the singleton instance used throughout the application
 * for managing MCP server sessions.
 */
export const serverManager = MCPServerManager.getInstance();

export type { MCPSession };
export { MCPServerManager };