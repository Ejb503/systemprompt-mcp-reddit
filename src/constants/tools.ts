/**
 * @file Tool constants and utilities for the Reddit MCP server
 * @module constants/tools
 * 
 * @remarks
 * This module aggregates all available MCP tools and provides utilities
 * for tool management. Tools are the primary way clients interact with
 * the Reddit API through this MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { analyseSubreddit } from '@reddit/constants/tool/analyse-subreddit';
import { getChannel } from '@reddit/constants/tool/get-channel';
import { getComment } from '@reddit/constants/tool/get-comment';
import { getNotifications } from '@reddit/constants/tool/get-notifications';
import { getPost } from '@reddit/constants/tool/get-post';
import { searchReddit } from '@reddit/constants/tool/search-reddit';
import type { RedditConfigData } from '@reddit/types/config';

/**
 * Standard error messages for tool operations.
 * 
 * @remarks
 * These messages are used when tool calls fail or when
 * an unknown tool is requested.
 */
export const TOOL_ERROR_MESSAGES = {
  /** Prefix for unknown tool errors */
  UNKNOWN_TOOL: 'Unknown tool:',
  /** Prefix for tool execution failures */
  TOOL_CALL_FAILED: 'Tool call failed:',
} as const;

/**
 * Standard response messages for tool operations.
 * 
 * @remarks
 * These messages are used for special tool responses,
 * such as when a tool triggers an asynchronous operation.
 */
export const TOOL_RESPONSE_MESSAGES = {
  /** Message returned when a tool triggers async processing (e.g., sampling) */
  ASYNC_PROCESSING: 'Request is being processed asynchronously',
} as const;

/**
 * Array of all available MCP tools for Reddit operations.
 * 
 * @remarks
 * Each tool provides specific functionality for interacting with Reddit:
 * - `getChannel`: Fetch subreddit information
 * - `getPost`: Retrieve a specific Reddit post
 * - `getNotifications`: Get user notifications and messages
 * - `analyseSubreddit`: Analyze subreddit content with AI assistance
 * - `searchReddit`: Search across Reddit
 * - `getComment`: Retrieve a specific comment
 * 
 * Tools that modify Reddit content (create, edit, delete) use the sampling
 * feature to generate content with AI assistance.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools}
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling}
 */
export const TOOLS: Tool[] = [
  getChannel,
  getPost,
  getNotifications,
  analyseSubreddit,
  searchReddit,
  getComment,
];

/**
 * Populates tools with initial data from Reddit configuration.
 * 
 * @remarks
 * This function can be used to inject user-specific data into tools
 * at initialization time. Currently, it creates a clone of each tool
 * to avoid modifying the original tool definitions.
 * 
 * @param tools - Array of tool definitions to populate
 * @param configData - Reddit configuration data containing user info
 * @returns Array of populated tool definitions
 * 
 * @example
 * ```typescript
 * const populatedTools = populateToolsInitialData(TOOLS, redditConfig);
 * ```
 */
export function populateToolsInitialData(tools: Tool[], configData: RedditConfigData): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}
