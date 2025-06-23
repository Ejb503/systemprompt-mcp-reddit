#!/usr/bin/env node
/**
 * @file Reddit MCP HTTP server implementation
 * @module reddit-mcp-server
 * 
 * @remarks
 * This module implements the HTTP server that handles OAuth authentication
 * and hosts the MCP endpoints. It provides:
 * - OAuth2 authorization flow for Reddit authentication
 * - MCP protocol endpoints for client communication
 * - Session management and security
 * - Health check and utility endpoints
 * 
 * The server uses Express.js and implements proper CORS handling for
 * cross-origin requests from MCP clients.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/architecture} MCP Architecture
 * @see {@link https://github.com/reddit-archive/reddit/wiki/OAuth2} Reddit OAuth2
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

import { CONFIG, VALID_REDIRECT_URIS } from './server/config';
import { OAuthServer } from './server/oauth-server';
import { setupMCPRoutes, setupUtilityRoutes } from './server/routes';

// Polyfill for jose library
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto as any;
}

/**
 * Main HTTP server class for the Reddit MCP server
 * 
 * @remarks
 * This class sets up and manages the Express.js server that handles:
 * - OAuth authentication flows
 * - MCP protocol endpoints
 * - Session management
 * - Health checks
 * 
 * The server supports both local development and production deployment
 * on platforms like Smithery.
 * 
 * @example
 * ```typescript
 * const server = new RedditMCPServer();
 * await server.start(3000);
 * // Server now listening on port 3000
 * ```
 */
export class RedditMCPServer {
  private readonly app: express.Application;
  private readonly oauthServer: OAuthServer;

  constructor() {
    this.app = express();

    // Initialize OAuth server
    this.oauthServer = new OAuthServer({
      REDDIT_CLIENT_ID: CONFIG.REDDIT_CLIENT_ID,
      REDDIT_CLIENT_SECRET: CONFIG.REDDIT_CLIENT_SECRET,
      JWT_SECRET: CONFIG.JWT_SECRET,
      OAUTH_ISSUER: CONFIG.OAUTH_ISSUER,
      REDIRECT_URL: CONFIG.REDIRECT_URL,
      REDDIT_USER_AGENT: CONFIG.REDDIT_USER_AGENT,
      validRedirectUris: VALID_REDIRECT_URIS,
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin: true,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept'],
        exposedHeaders: ['mcp-session-id', 'x-session-id'],
      }),
    );
    this.app.use(cookieParser());

    // Apply body parsing middleware selectively - NOT to MCP endpoints
    // MCP uses streaming and must not have body parsing
    this.app.use((req, res, next) => {
      if (req.path === '/mcp') {
        // Skip body parsing for MCP endpoint
        next();
      } else {
        // Apply body parsing for all other endpoints
        express.json()(req, res, (err) => {
          if (err) return next(err);
          express.urlencoded({ extended: true })(req, res, next);
        });
      }
    });
  }

  private setupRoutes(): void {
    this.oauthServer.setupRoutes(this.app);
    setupMCPRoutes(this.app, this.oauthServer.authMiddleware());
    setupUtilityRoutes(this.app);
  }

  public async start(port: number = 3000): Promise<void> {
    this.app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Reddit MCP Server running on port ${port}`);
      console.log(`🔐 OAuth authorize: ${CONFIG.OAUTH_ISSUER}/oauth/authorize`);
      console.log(`📡 MCP endpoint: ${CONFIG.OAUTH_ISSUER}/mcp`);
      console.log(`❤️  Health: ${CONFIG.OAUTH_ISSUER}/health`);
    });
  }

  /**
   * Gets the underlying Express application instance
   * 
   * @returns The Express application
   * 
   * @remarks
   * This method is useful for testing or extending the server
   * with additional middleware or routes.
   */
  public getExpressApp(): express.Application {
    return this.app;
  }
}

/**
 * Main execution function for standalone mode
 * 
 * @remarks
 * Creates and starts the server using the port from configuration.
 * This function is called when the module is executed directly.
 * 
 * @internal
 */
async function main() {
  const server = new RedditMCPServer();
  await server.start(parseInt(CONFIG.PORT, 10));
}

// Run the server in standalone mode if executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('reddit-mcp-server.ts');
if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for external use
export default RedditMCPServer;
