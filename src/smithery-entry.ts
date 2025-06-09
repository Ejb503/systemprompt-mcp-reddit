#!/usr/bin/env node
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto, { randomBytes, createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CallToolRequestSchema,
  CreateMessageRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { serverConfig, serverCapabilities } from "./config/server-config.js";
import { handleListResources, handleResourceCall } from "./handlers/resource-handlers.js";
import { handleListTools, handleToolCall } from "./handlers/tool-handlers.js";
import { handleListPrompts, handleGetPrompt } from "./handlers/prompt-handlers.js";
import { sendSamplingRequest } from "./handlers/sampling.js";
import { SystemPromptService } from "./services/systemprompt-service.js";

// Polyfill for jose library
if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto as any;
}

config();

interface PendingAuthorization {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  scope: string;
  redditState: string;
}

interface AuthenticatedRequest extends express.Request {
  auth?: AuthInfo;
}

export class RedditMCPServer {
  private app: express.Application;
  private mcpServer: Server;
  private mcpTransport: StreamableHTTPServerTransport;
  private jwtSecret: Uint8Array;
  private pendingAuthorizations = new Map<string, PendingAuthorization>();
  private authorizationCodes = new Map<
    string,
    {
      clientId: string;
      redirectUri: string;
      codeChallenge: string;
      userId: string;
      redditTokens: { accessToken: string; refreshToken: string };
      expiresAt: number;
    }
  >();

  private validRedirectUris = [
    "http://172.31.174.192:3000/callback",
    "systemprompt://oauth/callback",
    "http://172.31.174.192:3000/console/api/v1/reddit/auth/callback",
    "http://localhost:5173/callback",
    process.env.OAUTH_ISSUER ? `${process.env.OAUTH_ISSUER}/callback` : null,
    process.env.REDDIT_REDIRECT_URI || null,
  ].filter(Boolean) as string[];

  constructor() {
    // Initialize MCP server
    this.mcpServer = new Server(serverConfig, serverCapabilities);
    this.setupMCPHandlers();

    // Initialize MCP transport with authentication
    this.mcpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    this.setupMCPTransport();

    // Initialize Express app
    this.app = express();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    this.jwtSecret = new TextEncoder().encode(secret);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMCPHandlers(): void {
    // Initialize SystemPromptService without API key - it will be set per-request via headers
    SystemPromptService.initialize();

    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, handleListResources);
    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, handleResourceCall);
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, handleListTools);
    this.mcpServer.setRequestHandler(CallToolRequestSchema, handleToolCall);
    this.mcpServer.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);
    this.mcpServer.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);
    this.mcpServer.setRequestHandler(CreateMessageRequestSchema, sendSamplingRequest);
  }

  private setupMCPTransport(): void {
    this.mcpServer.connect(this.mcpTransport);
  }

  private setupMiddleware(): void {
    this.app.use(cors({ origin: true, credentials: true }));
    // Don't use express.json() globally - it interferes with MCP's raw body handling
    // We'll use it selectively on routes that need it
    this.app.use(cookieParser());
  }

  private async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret, {
        audience: "reddit-mcp-server",
        issuer: process.env.OAUTH_ISSUER || `http://localhost:${process.env.PORT || 3000}`,
      });

      return {
        token: token,
        clientId: "mcp-client",
        scopes: ["read"],
        expiresAt: payload.exp,
        extra: {
          userId: payload.sub,
          redditAccessToken: payload.reddit_access_token,
          redditRefreshToken: payload.reddit_refresh_token,
        },
      };
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  private authMiddleware() {
    return async (
      req: AuthenticatedRequest,
      res: express.Response,
      next: express.NextFunction,
    ): Promise<void> => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        res
          .status(401)
          .header(
            "WWW-Authenticate",
            `Bearer realm="MCP", resource="${baseUrl}/.well-known/oauth-protected-resource"`,
          )
          .json({
            error: "unauthorized",
            error_description: "Authorization required. Use OAuth 2.1 flow.",
          });
        return;
      }

      const token = authHeader.slice(7);

      try {
        req.auth = await this.verifyAccessToken(token);

        // Extract SystemPrompt API key from custom header
        const systempromptApiKey = req.headers["x-systemprompt-api-key"] as string;
        if (systempromptApiKey) {
          req.auth.extra = {
            ...req.auth.extra,
            systempromptApiKey: systempromptApiKey,
          };
        }

        next();
      } catch (error) {
        res.status(401).json({
          error: "invalid_token",
          error_description: "Invalid or expired access token",
        });
      }
    };
  }

  private setupRoutes(): void {
    // OAuth 2.0 Authorization Server Metadata
    this.app.get("/.well-known/oauth-authorization-server", (req, res) => {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        registration_endpoint: `${baseUrl}/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["read", "write"],
        token_endpoint_auth_methods_supported: ["none"],
        client_id: "mcp-client",
        redirect_uris: this.validRedirectUris,
      });
    });

    // OAuth 2.0 Protected Resource Metadata
    this.app.get("/.well-known/oauth-protected-resource", (req, res) => {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.json({
        resource: baseUrl,
        authorization_servers: [baseUrl],
        bearer_methods_supported: ["header"],
      });
    });

    // Dynamic Client Registration
    this.app.post("/oauth/register", express.json(), (req, res) => {
      res.json({
        client_id: "mcp-client",
        client_secret: null,
        redirect_uris: this.validRedirectUris,
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        application_type: "native",
      });
    });

    // Authorization endpoint
    this.app.get("/oauth/authorize", (req, res) => {
      const authRequest = {
        response_type: req.query.response_type as string,
        client_id: req.query.client_id as string,
        redirect_uri: req.query.redirect_uri as string,
        state: req.query.state as string,
        scope: (req.query.scope as string) || "read",
        code_challenge: req.query.code_challenge as string,
        code_challenge_method: req.query.code_challenge_method as string,
      };

      if (!authRequest.response_type || authRequest.response_type !== "code") {
        res.status(400).json({ error: "unsupported_response_type" });
        return;
      }

      if (!authRequest.code_challenge || authRequest.code_challenge_method !== "S256") {
        res.status(400).json({ error: "invalid_request", error_description: "PKCE required" });
        return;
      }

      if (!this.validRedirectUris.includes(authRequest.redirect_uri)) {
        res.status(400).json({
          error: "invalid_request",
          error_description: `Invalid redirect_uri. Supported URIs: ${this.validRedirectUris.join(", ")}`,
        });
        return;
      }

      const redditState = randomBytes(32).toString("base64url");

      this.pendingAuthorizations.set(redditState, {
        clientId: authRequest.client_id,
        redirectUri: authRequest.redirect_uri,
        codeChallenge: authRequest.code_challenge,
        codeChallengeMethod: authRequest.code_challenge_method,
        state: authRequest.state,
        scope: authRequest.scope,
        redditState: redditState,
      });

      const redditClientId = process.env.REDDIT_CLIENT_ID || "";
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const redditAuthUrl = new URL("https://www.reddit.com/api/v1/authorize");
      redditAuthUrl.searchParams.set("client_id", redditClientId);
      redditAuthUrl.searchParams.set("response_type", "code");
      redditAuthUrl.searchParams.set("state", redditState);
      redditAuthUrl.searchParams.set("redirect_uri", `${baseUrl}/oauth/reddit/callback`);
      redditAuthUrl.searchParams.set("duration", "permanent");
      redditAuthUrl.searchParams.set("scope", "identity read submit privatemessages");

      res.redirect(redditAuthUrl.toString());
    });

    // Reddit callback
    this.app.get("/oauth/reddit/callback", async (req, res) => {
      const { code, state, error } = req.query;

      if (error) {
        res.status(400).send("Reddit authorization denied");
        return;
      }

      const pending = this.pendingAuthorizations.get(state as string);
      if (!pending) {
        res.status(400).send("Invalid state");
        return;
      }

      this.pendingAuthorizations.delete(state as string);

      try {
        const actualCallbackUri = `${req.protocol}://${req.get("host")}/oauth/reddit/callback`;
        const redditTokens = await this.exchangeRedditCode(code as string, actualCallbackUri);
        const userInfo = await this.getRedditUserInfo(redditTokens.access_token);

        const authCode = randomBytes(32).toString("base64url");

        this.authorizationCodes.set(authCode, {
          clientId: pending.clientId,
          redirectUri: pending.redirectUri,
          codeChallenge: pending.codeChallenge,
          userId: userInfo.name,
          redditTokens: {
            accessToken: redditTokens.access_token,
            refreshToken: redditTokens.refresh_token,
          },
          expiresAt: Date.now() + 10 * 60 * 1000,
        });

        const redirectUrl = new URL(pending.redirectUri);
        redirectUrl.searchParams.set("code", authCode);
        redirectUrl.searchParams.set("state", pending.state);

        res.redirect(redirectUrl.toString());
      } catch (error) {
        console.error("Reddit callback error:", error);
        res.status(500).send("Authorization failed");
      }
    });

    // Token endpoint
    this.app.post(
      "/oauth/token",
      express.json(),
      express.urlencoded({ extended: true }),
      async (req, res) => {
        const { grant_type, code, redirect_uri, code_verifier, client_id } = req.body;

        if (grant_type !== "authorization_code") {
          res.status(400).json({ error: "unsupported_grant_type" });
          return;
        }

        const authCode = this.authorizationCodes.get(code);
        if (!authCode || Date.now() > authCode.expiresAt) {
          res.status(400).json({ error: "invalid_grant" });
          return;
        }

        const expectedChallenge = this.generateCodeChallenge(code_verifier);
        if (expectedChallenge !== authCode.codeChallenge) {
          res
            .status(400)
            .json({ error: "invalid_grant", error_description: "Invalid code_verifier" });
          return;
        }

        if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
          res.status(400).json({ error: "invalid_grant" });
          return;
        }

        this.authorizationCodes.delete(code);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const jwt = await new SignJWT({
          sub: authCode.userId,
          reddit_access_token: authCode.redditTokens.accessToken,
          reddit_refresh_token: authCode.redditTokens.refreshToken,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("1h")
          .setAudience("reddit-mcp-server")
          .setIssuer(baseUrl)
          .sign(this.jwtSecret);

        res.json({ access_token: jwt, token_type: "Bearer", expires_in: 3600, scope: "read" });
      },
    );

    // MCP endpoint using SDK transport with authentication
    this.app.all("/mcp", this.authMiddleware(), async (req: AuthenticatedRequest, res) => {
      (req as any).auth = req.auth;
      await this.mcpTransport.handleRequest(req, res);
    });

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        service: "reddit-mcp-server",
        transport: "http",
        capabilities: {
          oauth: true,
          mcp: true,
        },
      });
    });

    // Root endpoint
    this.app.get("/", (req, res) => {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.json({
        service: "Reddit MCP Server",
        version: "1.0.0",
        transport: "http",
        endpoints: {
          oauth: {
            authorize: `${baseUrl}/oauth/authorize`,
            token: `${baseUrl}/oauth/token`,
            metadata: `${baseUrl}/.well-known/oauth-authorization-server`,
          },
          mcp: `${baseUrl}/mcp`,
          health: `${baseUrl}/health`,
        },
      });
    });
  }

  private async exchangeRedditCode(code: string, actualCallbackUri: string): Promise<any> {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
    ).toString("base64");

    // Reddit requires a descriptive User-Agent with contact info
    // Format: platform:appid:version (by /u/username)
    const userAgent =
      process.env.REDDIT_USER_AGENT ||
      `${process.platform}:systemprompt-mcp-reddit:v2.0.0 (by /u/AffectionateHoney992'})`;

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: actualCallbackUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange Reddit code: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private async getRedditUserInfo(accessToken: string): Promise<any> {
    // Reddit requires a descriptive User-Agent with contact info
    // Format: platform:appid:version (by /u/username)
    const userAgent =
      process.env.REDDIT_USER_AGENT ||
      `${process.platform}:systemprompt-mcp-reddit:v2.0.0 (by /u/${process.env.REDDIT_USERNAME || "developer"})`;

    const response = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Reddit user info: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private generateCodeChallenge(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url");
  }

  public async start(port: number = 3000): Promise<void> {
    this.app.listen(port, () => {
      const baseHost =
        process.env.OAUTH_ISSUER?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ||
        `localhost:${port}`;
      console.log(`🚀 Reddit MCP Server (HTTP Transport) running on port ${port}`);
      console.log(`🔐 OAuth authorize: http://${baseHost}/oauth/authorize`);
      console.log(`📡 MCP endpoint: http://${baseHost}/mcp`);
      console.log(`❤️  Health: http://${baseHost}/health`);
    });
  }
}

// Main execution for standalone mode
async function main() {
  const server = new RedditMCPServer();
  await server.start(parseInt(process.env.PORT || "3000", 10));
}

// Run the server in standalone mode if executed directly
// Use process.argv to check if this is the main module
const isMainModule = process.argv[1] && process.argv[1].endsWith("smithery-entry.ts");
if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Export for Smithery - returns the MCP server instance
export default function () {
  // Initialize SystemPromptService without API key - it will be set per-request via headers
  SystemPromptService.initialize();

  // Create MCP server
  const mcpServer = new Server(serverConfig, serverCapabilities);

  // Set up handlers
  mcpServer.setRequestHandler(ListResourcesRequestSchema, handleListResources);
  mcpServer.setRequestHandler(ReadResourceRequestSchema, handleResourceCall);
  mcpServer.setRequestHandler(ListToolsRequestSchema, handleListTools);
  mcpServer.setRequestHandler(CallToolRequestSchema, handleToolCall);
  mcpServer.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);
  mcpServer.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);
  mcpServer.setRequestHandler(CreateMessageRequestSchema, sendSamplingRequest);

  // For OAuth support, we need to start the HTTP server in the background
  const httpServer = new RedditMCPServer();
  httpServer.start(parseInt(process.env.PORT || "3000", 10)).catch((error) => {
    console.error("Failed to start HTTP server:", error);
  });

  // Return the MCP server instance for Smithery
  return mcpServer;
}
