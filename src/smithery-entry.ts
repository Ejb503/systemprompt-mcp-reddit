/**
 * @file Smithery platform entry point
 * @module smithery-entry
 * 
 * @remarks
 * This module serves as the entry point when the Reddit MCP server is deployed
 * on the Smithery platform. Smithery is a deployment platform for MCP servers
 * that provides hosting, management, and discovery features.
 * 
 * The module exports:
 * - A server manager for MCP server lifecycle management
 * - A default function that starts the HTTP server for OAuth flows
 * 
 * Note that the actual MCP server instance is created and managed in the
 * routes module to allow for per-session authentication.
 * 
 * @see {@link https://smithery.ai} Smithery Platform
 * @see {@link https://modelcontextprotocol.io} Model Context Protocol
 */

import { RedditMCPServer } from './reddit-mcp-server';
import { CONFIG } from './server/config';

/**
 * Re-export the MCP server manager for Smithery integration
 * 
 * @remarks
 * The server manager handles creating and managing MCP server instances
 * for authenticated sessions.
 */
export { mcpServerManager as serverManager } from './server/mcp-server';

/**
 * Smithery entry point function
 * 
 * @returns null - The MCP server is created separately in routes.ts
 * 
 * @remarks
 * This function is called by Smithery when the server is deployed.
 * It starts the HTTP server for handling OAuth authentication flows
 * but does not create the MCP server directly. The MCP server is
 * created per-session in the routes module after authentication.
 */
export default function () {
  const httpServer = new RedditMCPServer();
  httpServer.start(parseInt(CONFIG.PORT, 10)).catch((error) => {
    console.error('Failed to start HTTP server:', error);
  });
  // Return null since the MCP server is managed in routes.ts
  return null;
}
