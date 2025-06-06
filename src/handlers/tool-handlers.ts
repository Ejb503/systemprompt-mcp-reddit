import { RedditService } from "../services/reddit/reddit-service.js";
import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { TOOLS } from "@/constants/tools.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { SystemPromptService } from "@/services/systemprompt-service.js";
import { validateWithErrors } from "@/utils/validation.js";
import { JSONSchema7 } from "json-schema";
import {
  handleGetChannelPosts,
  handleGetNotifications,
  handleAnalyseSubreddit,
  handleCreateRedditPost,
  handleCreateRedditComment,
  handleSendPost,
  handleGetPost,
  handleConfigureInstructions,
  handleSearchReddit,
  handleSendComment,
  handleGetComment,
  handleDeleteContent,
  handleEditContent,
  GetChannelPostsArgs,
  GetPostArgs,
  GetNotificationsArgs,
  AnalyseSubredditArgs,
  CreateRedditPostArgs,
  CreateRedditCommentArgs,
  SendPostArgs,
  SearchRedditArgs,
  ConfigureInstructionsArgs,
  SendCommentArgs,
  GetCommentArgs,
  DeleteContentArgs,
  EditContentArgs,
  CreateRedditMessageArgs,
  SendMessageArgs,
} from "./tools/index.js";
import { handleCreateRedditMessage } from "./tools/create-message.js";
import { handleSendMessage } from "./tools/send-message.js";

type ToolArgs = {
  configure_instructions: ConfigureInstructionsArgs;
  get_channel_posts: GetChannelPostsArgs;
  get_post: GetPostArgs;
  get_notifications: GetNotificationsArgs;
  analyse_subreddit: AnalyseSubredditArgs;
  create_post: CreateRedditPostArgs;
  create_comment: CreateRedditCommentArgs;
  create_message: CreateRedditMessageArgs;
  send_post: SendPostArgs;
  search_reddit: SearchRedditArgs;
  send_comment: SendCommentArgs;
  get_comment: GetCommentArgs;
  delete_content: DeleteContentArgs;
  edit_content: EditContentArgs;
  send_message: SendMessageArgs;
};

export async function handleListTools(request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    let tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    return { tools, _meta: { required: ["configure_instructions"] } };
  } catch (error) {
    return { tools: TOOLS };
  }
}

export async function handleToolCall(
  request: CallToolRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<CallToolResult> {
  const authInfo = extra?.authInfo;
  if (!authInfo?.extra?.redditAccessToken) {
    throw new Error("Authentication required: Reddit access token not found");
  }

  // Create Reddit service with auth tokens from the request
  const redditService = new RedditService({
    accessToken: authInfo.extra.redditAccessToken as string,
    refreshToken: authInfo.extra.redditRefreshToken as string,
  });

  const systemPromptService = SystemPromptService.getInstance();

  // Set SystemPrompt API key if provided in headers
  if (authInfo?.extra?.systempromptApiKey) {
    systemPromptService.setApiKey(authInfo.extra.systempromptApiKey as string);
  }

  // Check if SystemPrompt API key is available
  const hasSystemPromptApiKey = !!authInfo?.extra?.systempromptApiKey;

  const context = {
    redditService,
    systemPromptService,
    authInfo,
    hasSystemPromptApiKey,
  };

  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    validateWithErrors(request.params.arguments, tool.inputSchema as JSONSchema7);
    const args = request.params.arguments as ToolArgs[keyof ToolArgs];

    switch (request.params.name) {
      case "analyse_subreddit":
        return await handleAnalyseSubreddit(args as AnalyseSubredditArgs, context);
      case "create_post":
        return await handleCreateRedditPost(args as CreateRedditPostArgs, context);
      case "create_comment":
        return await handleCreateRedditComment(args as CreateRedditCommentArgs, context);
      case "create_message":
        return await handleCreateRedditMessage(args as CreateRedditMessageArgs, context);
      case "configure_instructions":
        return await handleConfigureInstructions(args as ConfigureInstructionsArgs, context);
      case "delete_content":
        return await handleDeleteContent(args as DeleteContentArgs, context);
      case "edit_content":
        return await handleEditContent(args as EditContentArgs, context);
      case "get_post":
        return await handleGetPost(args as GetPostArgs, context);
      case "get_posts":
        return await handleGetChannelPosts(args as GetChannelPostsArgs, context);
      case "get_notifications":
        return await handleGetNotifications(args as GetNotificationsArgs, context);
      case "get_comment":
        return await handleGetComment(args as GetCommentArgs, context);
      case "send_comment":
        return await handleSendComment(args as SendCommentArgs, context);
      case "send_post":
        return await handleSendPost(args as SendPostArgs, context);
      case "send_message":
        return await handleSendMessage(args as SendMessageArgs, context);
      case "search_reddit":
        return await handleSearchReddit(args as SearchRedditArgs, context);
      default:
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }
  } catch (error) {
    throw error;
  }
}
