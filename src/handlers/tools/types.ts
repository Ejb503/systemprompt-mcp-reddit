import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RedditService } from "../../services/reddit/reddit-service.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";

export interface ToolHandlerContext {
  redditService: RedditService;
  systemPromptService: SystemPromptService;
}

export type ToolHandler<T = any> = (
  args: T,
  context: ToolHandlerContext,
) => Promise<CallToolResult>;

export interface GetChannelPostsArgs {
  sort: "hot" | "new" | "controversial";
  subreddit: string;
}

export interface GetPostArgs {
  postId: string;
}

export interface GetRedditNotificationsArgs {
  filter?: "all" | "unread" | "messages" | "comments" | "mentions";
  limit?: number;
  markRead?: boolean;
}

export interface AnalyseSubredditArgs {
  subreddit: string;
}

export interface CreateRedditPostArgs {
  subreddit: string;
  content: string;
}

export interface CreateRedditReplyArgs {
  subreddit: string;
  content: string;
  messageId: string;
}

export interface SendRedditPostArgs {
  messageId: string;
}
