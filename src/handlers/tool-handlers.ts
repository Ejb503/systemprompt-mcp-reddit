/**
 * @file MCP Tool request handlers
 * @module handlers/tool-handlers
 * 
 * @remarks
 * This module implements the MCP tool handling functionality, managing
 * both tool listing and tool invocation. It serves as the main entry point
 * for all tool-related operations in the Reddit MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, TOOL_ERROR_MESSAGES } from '@reddit/constants/tools';
import { validateWithErrors } from '@reddit/utils/validation';
import type { JSONSchema7 } from "json-schema";
import { RedditService } from '../services/reddit/reddit-service';
import { logger } from '@/utils/logger';
import type { RedditAuthInfo, MCPToolContext } from '../types/request-context';
import type { ToolHandlerContext } from './tools/types';
import type {
  GetChannelArgs,
  GetPostArgs,
  GetNotificationsArgs,
  AnalyseSubredditArgs,
  SearchRedditArgs,
  GetCommentArgs,
} from './tools/index';
import {
  handleGetChannel,
  handleGetNotifications,
  handleAnalyseSubreddit,
  handleGetPost,
  handleSearchReddit,
  handleGetComment,
} from './tools/index';

/**
 * Type mapping of tool names to their argument types.
 * 
 * @remarks
 * This type ensures type safety when dispatching tool calls
 * to their respective handlers.
 */
type ToolArgs = {
  get_channel: GetChannelArgs;
  get_post: GetPostArgs;
  get_notifications: GetNotificationsArgs;
  analyse_subreddit: AnalyseSubredditArgs;
  search_reddit: SearchRedditArgs;
  get_comment: GetCommentArgs;
};

/**
 * Handles MCP tool listing requests.
 * 
 * @remarks
 * Returns all available tools sorted alphabetically by name.
 * This allows MCP clients to discover what tools are available
 * for interacting with Reddit.
 * 
 * @param _request - The tool listing request (currently unused)
 * @returns Promise resolving to the list of available tools
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#listing-tools | Listing Tools}
 */
export async function handleListTools(_request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    const tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    logger.debug("Listed tools successfully", { toolCount: tools.length });
    return { tools };
  } catch (error) {
    logger.error("Failed to list tools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { tools: TOOLS };
  }
}

/**
 * Reddit authentication credentials structure.
 * 
 * @remarks
 * Contains the OAuth tokens and user ID needed to authenticate
 * requests to the Reddit API.
 */
interface RedditCredentials {
  /** OAuth2 access token for API requests */
  accessToken: string;
  /** OAuth2 refresh token for renewing access */
  refreshToken: string;
  /** Reddit user ID */
  userId: string;
}

/**
 * Extracts and validates Reddit credentials from AuthInfo.
 * 
 * @remarks
 * This function ensures that all required authentication data
 * is present before attempting to make Reddit API calls.
 * 
 * @param authInfo - Authentication information from the MCP context
 * @returns Validated Reddit credentials
 * @throws Error if required credentials are missing
 */
function extractAndValidateCredentials(authInfo: RedditAuthInfo): RedditCredentials {
  logger.info("Extracting authentication credentials", {
    hasToken: !!authInfo.token,
    hasExtra: !!authInfo.extra,
    userId: authInfo.extra?.userId,
  });

  if (!authInfo.extra) {
    throw new Error("Authentication failed: Missing auth info");
  }

  const { userId, redditAccessToken, redditRefreshToken } = authInfo.extra;

  if (
    !redditAccessToken ||
    typeof redditAccessToken !== "string" ||
    redditAccessToken.trim() === ""
  ) {
    logger.error("Invalid or missing Reddit access token", {
      userId,
      hasAccessToken: !!redditAccessToken,
    });
    throw new Error("Authentication failed: Invalid Reddit access token");
  }

  if (
    !redditRefreshToken ||
    typeof redditRefreshToken !== "string" ||
    redditRefreshToken.trim() === ""
  ) {
    logger.error("Invalid or missing Reddit refresh token", {
      userId,
      hasRefreshToken: !!redditRefreshToken,
    });
    throw new Error("Authentication failed: Invalid Reddit refresh token");
  }

  if (!userId || typeof userId !== "string") {
    logger.error("Invalid or missing user ID", {
      userId,
      userIdType: typeof userId,
    });
    throw new Error("Authentication failed: Invalid user ID");
  }

  logger.info("Reddit credentials validated successfully", {
    userId,
    accessTokenLength: redditAccessToken.length,
    refreshTokenLength: redditRefreshToken.length,
  });

  return {
    accessToken: redditAccessToken,
    refreshToken: redditRefreshToken,
    userId,
  };
}

/**
 * Handles MCP tool invocation requests.
 * 
 * @remarks
 * This is the main dispatcher for tool calls. It:
 * 1. Validates the requested tool exists
 * 2. Extracts and validates authentication credentials
 * 3. Validates tool arguments against the tool's input schema
 * 4. Creates a Reddit service instance
 * 5. Dispatches to the appropriate tool handler
 * 6. Returns the tool result or error
 * 
 * Tools that require content generation (like create_post) will trigger
 * the sampling feature and return an async processing message.
 * 
 * @param request - The tool invocation request containing tool name and arguments
 * @param context - MCP context containing authentication and session information
 * @returns Promise resolving to the tool execution result
 * @throws Error if tool is unknown, auth fails, or execution fails
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#calling-tools | Calling Tools}
 */
export async function handleToolCall(
  request: CallToolRequest,
  context: MCPToolContext,
): Promise<CallToolResult> {
  const startTime = Date.now();
  logger.info("Tool call initiated", {
    toolName: request.params?.name,
    hasArguments: !!request.params?.arguments,
    sessionId: context.sessionId,
    userId: context.authInfo.extra?.userId,
  });

  try {
    // Extract and validate Reddit credentials from AuthInfo
    const credentials = extractAndValidateCredentials(context.authInfo);

    logger.debug("Creating Reddit service with validated credentials", {
      userId: credentials.userId,
      toolName: request.params?.name,
      sessionId: context.sessionId,
    });

    // Create Reddit service with validated tokens
    const redditService = new RedditService({
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      username: credentials.userId, // Pass the Reddit username from OAuth
    });

    const handlerContext: ToolHandlerContext = {
      redditService,
      userId: credentials.userId,
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };

    if (!request.params.arguments) {
      logger.error("Tool call missing required arguments", { toolName: request.params?.name });
      throw new Error("Arguments are required");
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    logger.debug("Validating tool arguments", {
      toolName: request.params.name,
      argumentKeys: Object.keys(request.params.arguments),
    });

    validateWithErrors(request.params.arguments, tool.inputSchema as JSONSchema7);
    const args = request.params.arguments as ToolArgs[keyof ToolArgs];

    logger.debug("Tool arguments validated successfully", {
      toolName: request.params.name,
      userId: credentials.userId,
    });

    let result: CallToolResult;

    switch (request.params.name) {
      case "get_channel":
        result = await handleGetChannel(args as GetChannelArgs, handlerContext);
        break;
      case "analyse_subreddit":
        result = await handleAnalyseSubreddit(args as AnalyseSubredditArgs, handlerContext);
        break;
      case "get_post":
        result = await handleGetPost(args as GetPostArgs, handlerContext);
        break;
      case "get_notifications":
        result = await handleGetNotifications(args as GetNotificationsArgs, handlerContext);
        break;
      case "get_comment":
        result = await handleGetComment(args as GetCommentArgs, handlerContext);
        break;
      case "search_reddit":
        result = await handleSearchReddit(args as SearchRedditArgs, handlerContext);
        break;
      default:
        logger.error("Unsupported tool in switch statement", { toolName: request.params.name });
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    const duration = Date.now() - startTime;
    logger.info("Tool call completed successfully", {
      toolName: request.params.name,
      userId: credentials.userId,
      duration,
      resultType: result.content?.[0]?.type,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Tool call failed", {
      toolName: request.params?.name,
      error: errorMessage,
      duration,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw the error to be handled by MCP framework
    throw error;
  }
}
