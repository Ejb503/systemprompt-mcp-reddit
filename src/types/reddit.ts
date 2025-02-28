export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  selftext?: string;
  url?: string;
  score: number;
  createdUtc: number;
  numComments: number;
  permalink: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  createdUtc: number;
  permalink: string;
}

export interface RedditCommentThread {
  comment: RedditComment;
  replies: RedditCommentThread[];
}

export interface RedditPostWithComments extends RedditPost {
  comments: RedditCommentThread[];
}

export interface RedditUser {
  name: string;
  createdUtc: number;
  commentKarma: number;
  linkKarma: number;
  isMod: boolean;
}

export interface RedditSubreddit {
  displayName: string;
  title: string;
  publicDescription: string;
  subscribers: number;
  createdUtc: number;
  over18: boolean;
  allowedPostTypes: string[];
  rules: Array<{
    title: string;
    description: string;
  }>;
  postRequirements: {
    title?: {
      minLength?: number;
      maxLength?: number;
      allowedPrefixes?: string[];
      bannedPhrases?: string[];
    };
    body?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
    };
    flairRequired?: boolean;
  };
}

export interface RedditApiResponse<T> {
  kind: string;
  data: {
    children?: Array<{
      kind: string;
      data: T;
    }>;
    [key: string]: any;
  };
}

export interface FetchPostsOptions {
  sort: "hot" | "new" | "controversial";
  timeFilter?: string;
  limit?: number;
  subreddits?: string[];
}

export interface RedditServiceConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  appName: string;
  appVersion: string;
  username: string;
}

export interface RedditAuthResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

export interface RedditPostParams {
  subreddit: string;
  title: string;
  kind: "text" | "link";
  content?: string;
  url?: string;
}

export interface RedditPostResponse {
  id: string;
  url: string;
  title: string;
  subreddit: string;
}

export interface SubredditRulesResponse {
  rules: Array<{
    short_name: string;
    description: string;
  }>;
}

export interface SubredditRequirements {
  allowedPostTypes: string[];
  rules: Array<{
    title: string;
    description: string;
  }>;
  titleRequirements?: {
    minLength?: number;
    maxLength?: number;
    allowedPrefixes?: string[];
    bannedPhrases?: string[];
  };
  bodyRequirements?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
  flairRequired?: boolean;
}

export interface RedditNotification {
  id: string;
  name: string;
  type: "comment_reply" | "post_reply" | "username_mention" | "message" | "other";
  subject: string;
  body: string;
  date: Date;
  author: string;
  subreddit?: string;
  context?: string;
  postId?: string;
  commentId?: string;
  createdUtc: number;
  isNew: boolean;
  permalink?: string;
}

export interface FetchNotificationsOptions {
  filter?: "all" | "unread" | "messages" | "comments" | "mentions";
  limit?: number;
  markRead?: boolean;
  excludeIds?: string[];
  excludeTypes?: Array<"comment_reply" | "post_reply" | "username_mention" | "message" | "other">;
  excludeSubreddits?: string[];
  after?: string;
  before?: string;
}

export interface FetchSubscribedSubredditsOptions {
  limit?: number;
  after?: string;
}

export interface SubscribedSubreddit {
  id: string;
  name: string;
  displayName: string;
  title: string;
  description: string;
  subscribers: number;
  isNsfw: boolean;
  url: string;
  icon?: string;
  createdUtc: number;
  type: string;
}

export type RedditErrorType =
  | "CONFIGURATION_ERROR"
  | "INITIALIZATION_ERROR"
  | "AUTH_ERROR"
  | "API_ERROR"
  | "RATE_LIMIT_ERROR"
  | "VALIDATION_ERROR";

export class RedditError extends Error {
  constructor(
    message: string,
    public readonly type: RedditErrorType,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RedditError";
  }
}
