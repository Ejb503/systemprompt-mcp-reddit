import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RedditService } from "../../services/reddit/reddit-service.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { RedditErrorType } from "@/types/reddit.js";
import { JSONSchema7 } from "json-schema";

export interface ToolHandlerContext {
  redditService: RedditService;
  systemPromptService: SystemPromptService;
}

export type ToolHandler<T = any> = (
  args: T,
  context: ToolHandlerContext,
) => Promise<CallToolResult>;

// Standard response type for all tool handlers
export interface ToolResponse<T = any> {
  status: "success" | "error";
  message: string;
  result?: T;
  error?: {
    type: RedditErrorType | string;
    details?: any;
  };
}

// Helper function to format tool responses
export function formatToolResponse<T>(
  response: Partial<ToolResponse<T>> &
    Pick<ToolResponse<T>, "message"> & {
      schema?: JSONSchema7;
      type: "api" | "server" | "sampling";
      title?: string;
    },
): CallToolResult {
  const standardResponse: ToolResponse<T> = {
    status: response.status || "success",
    message: response.message,
    ...(response.result && { result: response.result }),
    ...(response.error && { error: response.error }),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(standardResponse, null, 2),
      },
    ],
    ...(response.schema && {
      _meta: {
        schema: response.schema,
        type: response.type,
        title: response.title || response.message,
      },
    }),
  };
}

export interface RedditSubredditConfig {
  name: string;
  description?: string;
  tags?: string[];
}

export interface RedditPreferences {
  defaultSort?: "hot" | "new" | "top" | "rising" | "controversial";
  timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
  contentFilter?: "all" | "posts" | "comments";
  nsfwFilter?: boolean;
  minimumScore?: number;
  maxPostsPerRequest?: number;
}

export interface FetchRedditContentArgs {
  sortBy: "hot" | "new" | "top" | "rising" | "controversial";
  timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
  limit?: number;
  subreddits?: string;
}

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
  excludeIds?: string[];
  excludeTypes?: Array<"comment_reply" | "post_reply" | "username_mention" | "message" | "other">;
  excludeSubreddits?: string[];
  after?: string;
  before?: string;
}

export interface DeleteNotificationArgs {
  notificationId: string;
}

export interface AnalyseSubredditArgs {
  subreddit: string;
}

export interface ConfigureInstructionsArgs {
  content: string;
}

export interface CreateRedditPostArgs {
  subreddit: string;
  content: string;
  kind?: "self" | "link";
  url?: string;
}

export interface CreateRedditReplyArgs {
  subreddit: string;
  content: string;
  messageId: string;
}

export interface SendRedditPostArgs {
  messageId: string;
  subreddit: string;
  title: string;
  content?: string;
  kind?: "self" | "link";
  url?: string;
}

export interface SearchRedditArgs {
  query: string;
  subreddit?: string;
  sort?: "relevance" | "hot" | "new" | "top";
  time?: "hour" | "day" | "week" | "month" | "year" | "all";
  limit?: number;
}

export interface GetCommentArgs {
  commentId: string;
  includeThread?: boolean;
  postId?: string;
}

export interface SendReplyArgs {
  parentId: string; // Can be either a post ID or comment ID
  content: string;
}
