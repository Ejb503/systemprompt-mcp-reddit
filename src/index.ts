#!/usr/bin/env node
/**
 * @file Main entry point for the Reddit MCP server
 * @module index
 * 
 * @remarks
 * This is the executable entry point for the Reddit MCP server when run directly.
 * It loads environment variables, creates a server instance, and starts listening
 * on port 3000 with automatic OAuth handling.
 * 
 * The server can be started using:
 * - `npm start` - Production mode
 * - `npm run dev` - Development mode with auto-reload
 * - `node dist/index.js` - Direct execution
 * 
 * Required environment variables:
 * - REDDIT_CLIENT_ID: OAuth2 client ID from Reddit app
 * - REDDIT_CLIENT_SECRET: OAuth2 client secret
 * 
 * @see {@link RedditMCPServer} for the main server implementation
 * @see {@link https://modelcontextprotocol.io} Model Context Protocol Documentation
 */

import dotenv from 'dotenv';
dotenv.config();

// Import and run the server for direct execution
import RedditMCPServer from './reddit-mcp-server';

/**
 * Main application entry point
 * 
 * @remarks
 * Creates and starts the Reddit MCP server on port 3000.
 * The server will automatically handle OAuth authentication
 * if credentials are not already stored.
 */
async function main() {
  const server = new RedditMCPServer();
  await server.start(3000);
}

// Always run the server when index.ts is executed
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
