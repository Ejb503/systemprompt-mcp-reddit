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

/**
 * Parameters for creating a new Reddit post
 * Matches Reddit's /api/submit endpoint requirements
 */
export interface RedditPostParams {
  /** Subreddit to post to (without r/ prefix) */
  subreddit: string;
  /** Post title (1-300 characters) */
  title: string;
  /** Type of post - 'self' for text posts, 'link' for URL posts */
  kind: "self" | "link";
  /** Text content for self posts */
  content?: string;
  /** URL for link posts */
  url?: string;
  /** Flair ID if the subreddit requires it */
  flair_id?: string;
  /** Flair text if the subreddit requires it */
  flair_text?: string;
  /** Whether to send replies to inbox */
  sendreplies?: boolean;
  /** Whether to mark as NSFW */
  nsfw?: boolean;
  /** Whether to mark as spoiler */
  spoiler?: boolean;
}

/**
 * Response from creating a post
 * Matches Reddit's /api/submit response
 */
export interface RedditPostResponse {
  /** Post ID with t3_ prefix */
  id: string;
  /** Full reddit URL to the post */
  url: string;
  /** Post title */
  title: string;
  /** Subreddit the post was created in */
  subreddit: string;
  /** Full permalink */
  permalink: string;
}

/**
 * Parameters for sending a reply
 * Used for both comments and post replies
 */
export interface RedditReplyParams {
  /**
   * ID of parent thing to reply to, with prefix
   * t1_ prefix for replying to comments
   * t3_ prefix for replying to posts
   */
  parentId: string;
  /** The markdown text of the comment (10000 char max) */
  text: string;
  /** Whether to send reply notifications */
  sendreplies?: boolean;
}

/**
 * Response from creating a reply
 * Matches Reddit's comment creation response
 */
export interface RedditReplyResponse {
  /** Comment ID with t1_ prefix */
  id: string;
  /** Parent ID that was replied to */
  parentId: string;
  /** The created comment's text */
  body: string;
  /** Full permalink to the comment */
  permalink: string;
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
  /** Full ID with prefix (t1_, t3_, t4_) */
  id: string;
  /** Full name with prefix */
  name: string;
  type: "comment_reply" | "post_reply" | "username_mention" | "message" | "other";
  subject: string;
  body: string;
  date: Date;
  author: string;
  subreddit?: string;
  context?: string;
  /**
   * ID of parent thing being replied to, with prefix
   * t1_ prefix for comments
   * t3_ prefix for posts
   */
  parentId?: string;
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

export interface FlairResponse {
  choices: Array<{
    flair_template_id: string;
    text: string;
    text_editable: boolean;
    type: string;
    background_color: string;
    text_color: string;
    mod_only: boolean;
  }>;
}

export interface SubredditFlair {
  id: string;
  text: string;
  type: "text" | "richtext" | "image";
  textEditable?: boolean;
  backgroundColor?: string;
  textColor?: string;
  modOnly?: boolean;
}

export interface RedditService {
  // Authentication
  initialize(): Promise<void>;
  refreshAccessToken(): Promise<void>;

  // Posts and Comments
  createPost(params: RedditPostParams): Promise<RedditPostResponse>;
  sendReply(params: RedditReplyParams): Promise<RedditReplyResponse>;
  getPost(postId: string): Promise<RedditPost>;
  getComment(commentId: string): Promise<RedditComment>;

  // Subreddit Information
  getSubredditInfo(subreddit: string): Promise<RedditSubreddit>;
  getSubredditRules(subreddit: string): Promise<SubredditRulesResponse>;
  getSubredditRequirements(subreddit: string): Promise<SubredditRequirements>;
  /**
   * Fetches available post flairs for a subreddit
   * @param subreddit The subreddit name (without r/ prefix)
   * @returns Array of available flairs
   */
  getSubredditFlairs(subreddit: string): Promise<SubredditFlair[]>;

  // Notifications
  fetchNotifications(options?: FetchNotificationsOptions): Promise<RedditNotification[]>;
  deleteNotification(notificationId: string): Promise<void>;

  // Subscriptions
  fetchSubscribedSubreddits(
    options?: FetchSubscribedSubredditsOptions,
  ): Promise<SubscribedSubreddit[]>;
}
