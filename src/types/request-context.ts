/**
 * Strongly typed request context for MCP handlers
 */

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// Extended auth info with Reddit-specific data in the extra field
export interface RedditAuthInfo extends AuthInfo {
  extra?: {
    userId?: string;
    redditAccessToken?: string;
    redditRefreshToken?: string;
  };
}

// The extra context passed to MCP request handlers
// Based on MCP SDK's RequestHandlerExtra type
export interface MCPHandlerExtra {
  signal: AbortSignal;
  authInfo?: RedditAuthInfo;
  sessionId?: string;
  _meta?: any;
  requestId: string | number;
  sendNotification: (notification: any) => Promise<void>;
  sendRequest: (request: any, resultSchema: any, options?: any) => Promise<any>;
}

// Context passed from MCP server to tool handler function
export interface MCPToolContext {
  sessionId: string;
  authInfo: RedditAuthInfo;
}