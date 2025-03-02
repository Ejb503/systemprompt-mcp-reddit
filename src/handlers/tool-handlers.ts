import { RedditService } from "../services/reddit/reddit-service.js";
import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOLS } from "@/constants/tools.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { SystemPromptService } from "@/services/systemprompt-service.js";
import { validateWithErrors } from "@/utils/validation.js";
import { JSONSchema7 } from "json-schema";
import {
  handleGetChannelPosts,
  handleGetRedditNotifications,
  handleAnalyseSubreddit,
  handleCreateRedditPost,
  handleCreateRedditReply,
  handleSendPost,
  handleGetPost,
  handleConfigureInstructions,
  handleSearchReddit,
  handleSendReply,
  handleGetComment,
  handleDeleteContent,
  handleEditContent,
  GetChannelPostsArgs,
  GetPostArgs,
  GetRedditNotificationsArgs,
  AnalyseSubredditArgs,
  CreateRedditPostArgs,
  CreateRedditReplyArgs,
  SendPostArgs,
  SearchRedditArgs,
  ConfigureInstructionsArgs,
  SendReplyArgs,
  GetCommentArgs,
  DeleteContentArgs,
  EditContentArgs,
} from "./tools/index.js";

type ToolArgs = {
  configure_instructions: ConfigureInstructionsArgs;
  get_channel_posts: GetChannelPostsArgs;
  get_post: GetPostArgs;
  get_reddit_notifications: GetRedditNotificationsArgs;
  analyse_subreddit: AnalyseSubredditArgs;
  create_reddit_post: CreateRedditPostArgs;
  create_reddit_reply: CreateRedditReplyArgs;
  send_post: SendPostArgs;
  search_reddit: SearchRedditArgs;
  send_reply: SendReplyArgs;
  get_comment: GetCommentArgs;
  delete_content: DeleteContentArgs;
  edit_content: EditContentArgs;
};

export async function handleListTools(request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    let tools = [...TOOLS];
    return { tools, _meta: { required: ["configure_instructions"] } };
  } catch (error) {
    return { tools: TOOLS };
  }
}

export async function handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
  const redditService = RedditService.getInstance();
  const systemPromptService = SystemPromptService.getInstance();

  const context = {
    redditService,
    systemPromptService,
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
      case "get_channel_posts":
        return await handleGetChannelPosts(args as GetChannelPostsArgs, context);
      case "get_post":
        return await handleGetPost(args as GetPostArgs, context);
      case "get_posts":
        return await handleGetChannelPosts(args as GetChannelPostsArgs, context);
      case "get_reddit_notifications":
        return await handleGetRedditNotifications(args as GetRedditNotificationsArgs, context);
      case "analyse_subreddit":
        return await handleAnalyseSubreddit(args as AnalyseSubredditArgs, context);
      case "create_reddit_post":
        return await handleCreateRedditPost(args as CreateRedditPostArgs, context);
      case "create_reddit_reply":
        return await handleCreateRedditReply(args as CreateRedditReplyArgs, context);
      case "send_post":
        return await handleSendPost(args as SendPostArgs, context);
      case "search_reddit":
        return await handleSearchReddit(args as SearchRedditArgs, context);
      case "configure_instructions":
        return await handleConfigureInstructions(args as ConfigureInstructionsArgs, context);
      case "send_reply":
        return await handleSendReply(args as SendReplyArgs, context);
      case "get_comment":
        return await handleGetComment(args as GetCommentArgs, context);
      case "delete_content":
        return await handleDeleteContent(args as DeleteContentArgs, context);
      case "edit_content":
        return await handleEditContent(args as EditContentArgs, context);
      default:
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }
  } catch (error) {
    throw error;
  }
}
