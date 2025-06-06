import {
  RedditPost,
  RedditServiceConfig,
  RedditError,
  RedditPostParams,
  RedditPostResponse,
  RedditReplyParams,
  RedditReplyResponse,
  FetchPostsOptions,
  RedditPostWithComments,
  RedditNotification as ApiRedditNotification,
  FetchNotificationsOptions,
  FetchSubscribedSubredditsOptions,
  SubscribedSubreddit,
  RedditComment,
  RedditCommentThread,
  SubredditFlair,
} from "@/types/reddit.js";
import type {
  RedditConfigData,
  RedditNotification as ConfigRedditNotification,
  RedditMessage,
  SubredditInfo,
} from "../../types/config.js";
import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditPostService } from "./reddit-post-service.js";
import { RedditSubredditService } from "./reddit-subreddit-service.js";
import { transformToConfigNotification } from "../../utils/reddit-transformers.js";

interface FlairResponse {
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

export interface RedditCommentParams {
  id: string;
  text: string;
  sendreplies?: boolean;
}

export interface RedditCommentResponse {
  id: string;
  text: string;
  permalink: string;
}

export interface RedditMessageParams {
  recipient: string;
  subject: string;
  content: string;
}

export interface RedditMessageResponse {
  id: string;
  recipient: string;
  subject: string;
  body: string;
}

/**
 * Main service for interacting with the Reddit API
 * Implements facade pattern to coordinate between specialized services
 */
export class RedditService {
  private static instance: RedditService;
  private readonly baseUrl = "https://oauth.reddit.com";
  private readonly rateLimitDelay = 2000; // 1 request per second
  private initialized = false;

  private authService: RedditAuthService;
  private postService: RedditPostService;
  private subredditService: RedditSubredditService;

  constructor(authTokens?: { accessToken: string; refreshToken: string }) {
    this.initialized = false;

    if (authTokens) {
      // Create auth service with provided tokens
      const config = {
        clientId: process.env.REDDIT_CLIENT_ID ?? "",
        clientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
        refreshToken: authTokens.refreshToken,
        appName: "Systemprompt MCP Reddit",
        appVersion: "1.0.9",
        username: "AutomatedBot",
      };
      this.authService = new RedditAuthService(config);
      // Set the access token directly
      this.authService.setAccessToken(authTokens.accessToken);
      this.initialized = true;
    } else {
      // Use environment-based config
      const config = this.loadConfig();
      this.authService = new RedditAuthService(config);
    }

    this.postService = new RedditPostService(this.baseUrl, this.authService, this.rateLimitDelay);
    this.subredditService = new RedditSubredditService(
      this.baseUrl,
      this.authService,
      this.rateLimitDelay,
    );
  }

  public static getInstance(): RedditService {
    if (!RedditService.instance) {
      RedditService.instance = new RedditService();
    }
    return RedditService.instance;
  }

  /**
   * Initialize the service and authenticate (for singleton pattern)
   * @throws {RedditError} if initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.authService.initialize();
      this.initialized = true;
    } catch (error) {
      throw new RedditError(
        `Failed to initialize Reddit service: ${error instanceof Error ? error.message : "Unknown error"}`,
        "INITIALIZATION_ERROR",
        error,
      );
    }
  }

  /**
   * Loads configuration from environment variables
   * @throws {RedditError} if required environment variables are missing
   */
  private loadConfig(): RedditServiceConfig {
    const requiredEnvVars = {
      clientId: process.env.REDDIT_CLIENT_ID ?? "",
      clientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
      refreshToken: process.env.REDDIT_REFRESH_TOKEN ?? "",
    } as const;

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new RedditError(
        `Missing required environment variables: ${missingVars.join(", ")}`,
        "CONFIGURATION_ERROR",
      );
    }

    return {
      ...requiredEnvVars,
      appName: "Systemprompt MCP Reddit",
      appVersion: "1.0.9",
      username: "AutomatedBot",
    };
  }

  /**
   * Fetches posts based on provided options
   */
  public async fetchPosts(options: FetchPostsOptions): Promise<RedditPost[]> {
    this.checkInitialized();
    return this.postService.fetchPosts(options);
  }

  /**
   * Creates a new post on Reddit
   * @throws {RedditError} if post creation fails or validation fails
   */
  public async createPost(params: RedditPostParams): Promise<RedditPostResponse> {
    this.checkInitialized();

    // Validate title length
    if (params.title.length < 1 || params.title.length > 300) {
      throw new RedditError("Post title must be between 1 and 300 characters", "VALIDATION_ERROR");
    }
    // Get subreddit requirements
    const subredditInfo = await this.getSubredditInfo(params.subreddit);

    // Check if flair is required
    if (subredditInfo.flairRequired && !params.flair_id && !params.flair_text) {
      throw new RedditError(
        `Flair is required for posts in r/${params.subreddit}`,
        "VALIDATION_ERROR",
      );
    }

    return this.postService.createPost(params);
  }

  /**
   * Fetches subreddit information and rules
   */
  public async getSubredditInfo(subreddit: string) {
    this.checkInitialized();
    return this.subredditService.getSubredditInfo(subreddit);
  }

  /**
   * Fetches a single Reddit post by its ID
   * @param id The ID of the post to fetch
   * @returns The fetched post with comments
   */
  public async fetchPostById(id: string): Promise<RedditPostWithComments> {
    this.checkInitialized();
    return this.postService.fetchPostById(id);
  }

  /**
   * Fetches user notifications (inbox items) from Reddit
   * @param options Options for fetching notifications
   * @returns Array of notifications
   */
  public async fetchNotifications(
    options: FetchNotificationsOptions = {},
  ): Promise<ApiRedditNotification[]> {
    this.checkInitialized();
    const response = await this.postService.fetchNotifications(options);
    return response;
  }

  /**
   * Fetches the list of subreddits the authenticated user is subscribed to
   * @param options Options for fetching subscribed subreddits
   * @returns Array of subscribed subreddits
   */
  public async fetchSubscribedSubreddits(
    options: FetchSubscribedSubredditsOptions = {},
  ): Promise<SubscribedSubreddit[]> {
    this.checkInitialized();
    return this.subredditService.fetchSubscribedSubreddits(options);
  }

  public async fetchUserInfo() {
    this.checkInitialized();
    return this.authService.fetchUserInfo();
  }

  public async fetchUserPreferences() {
    this.checkInitialized();
    return this.authService.fetchUserPreferences();
  }

  /**
   * Formats a notification for the config response
   */
  private formatNotification(
    notification: ApiRedditNotification,
  ): ConfigRedditNotification | RedditMessage {
    return transformToConfigNotification(notification);
  }

  /**
   * Formats subreddit info for the config response
   */
  private formatSubredditInfo = (subreddit: SubscribedSubreddit): SubredditInfo => {
    return {
      id: subreddit.id,
      name: subreddit.name,
      display_name: subreddit.displayName,
      title: subreddit.title,
      description: subreddit.description,
      subscribers: subreddit.subscribers,
      created_utc: subreddit.createdUtc,
      url: subreddit.url,
      over18: subreddit.isNsfw,
      icon_img: subreddit.icon,
      user_is_subscriber: true, // Since this is from subscribed subreddits
      user_is_moderator: false, // We don't have this info from the subscribed endpoint
      rules: [], // Rules are not included in the subscribed endpoint
      post_requirements: undefined, // Post requirements are not included in the subscribed endpoint
    };
  };

  /**
   * Gets the complete Reddit configuration including user info, notifications,
   * and subscribed subreddits
   */
  public async getRedditConfig(): Promise<RedditConfigData> {
    this.checkInitialized();

    try {
      // Fetch all required data in parallel
      const [allNotifications, subscribedSubreddits, userInfo, userPreferences] = await Promise.all(
        [
          this.fetchNotifications({ filter: "all", limit: 10, markRead: false }),
          this.fetchSubscribedSubreddits({ limit: 50 }),
          this.fetchUserInfo(),
          this.fetchUserPreferences(),
        ],
      );

      // Transform notifications and messages
      const transformed = allNotifications.map((n) => this.formatNotification(n));

      // Separate messages from notifications
      const messages = transformed.filter((n): n is RedditMessage => n.type === "message");
      const notifications = transformed.filter(
        (n): n is ConfigRedditNotification => n.type !== "message",
      );

      // Format the data according to our schema
      return {
        notifications,
        messages,
        subscribedSubreddits: subscribedSubreddits.map(this.formatSubredditInfo),
        user: {
          ...userInfo,
          preferences: userPreferences,
        },
      };
    } catch (error) {
      throw new RedditError(
        `Failed to fetch Reddit configuration: ${error instanceof Error ? error.message : error}`,
        "API_ERROR",
      );
    }
  }

  /**
   * Search Reddit posts
   */
  public async searchReddit(options: {
    query: string;
    subreddit?: string;
    sort?: "relevance" | "hot" | "new" | "top";
    time?: "hour" | "day" | "week" | "month" | "year" | "all";
    limit?: number;
  }): Promise<RedditPost[]> {
    this.checkInitialized();
    return this.postService.searchReddit(options);
  }

  /**
   * Fetches a single comment by its ID
   * @param id The ID of the comment to fetch
   * @returns The fetched comment
   */
  public async fetchCommentById(id: string): Promise<RedditComment> {
    this.checkInitialized();
    return this.postService.fetchCommentById(id);
  }

  /**
   * Fetches a comment thread (comment with all its replies)
   * @param id The ID of the post containing the comment
   * @param id The ID of the comment to fetch
   * @returns The comment thread with all replies
   */
  public async fetchCommentThread(parentId: string, id: string): Promise<RedditCommentThread> {
    this.checkInitialized();
    return this.postService.fetchCommentThread(parentId, id);
  }

  /**
   * Sends a reply to a post or comment
   * @param params Reply parameters including parent ID and text
   * @throws {RedditError} if reply fails or validation fails
   */
  public async sendReply(params: RedditReplyParams): Promise<RedditReplyResponse> {
    this.checkInitialized();

    // Validate parent ID format
    if (!params.id.match(/^t[1|3]_[a-z0-9]+$/i)) {
      throw new RedditError(
        "Invalid parent ID format. Must start with t1_ or t3_",
        "VALIDATION_ERROR",
      );
    }

    // Validate text length
    if (params.text.length > 10000) {
      throw new RedditError(
        "Reply text exceeds maximum length of 10000 characters",
        "VALIDATION_ERROR",
      );
    }

    return this.postService.sendReply(params.id, params.text);
  }

  /**
   * Fetches available post flairs for a subreddit
   * @param subreddit The subreddit name (without r/ prefix)
   * @returns Array of available flairs
   */
  async getSubredditFlairs(subreddit: string): Promise<SubredditFlair[]> {
    try {
      const response = await this.subredditService.getFlairs(subreddit);

      return response.choices.map((flair: FlairResponse["choices"][0]) => ({
        id: flair.flair_template_id,
        text: flair.text,
        type: flair.type as "text" | "richtext" | "image",
        textEditable: flair.text_editable,
        backgroundColor: flair.background_color,
        textColor: flair.text_color,
        modOnly: flair.mod_only,
      }));
    } catch (error) {
      // If we can't fetch flairs (e.g., no permission, subreddit doesn't exist), return empty array
      console.warn(`Failed to fetch flairs for subreddit ${subreddit}:`, error);
      return [];
    }
  }

  public async sendComment(params: RedditCommentParams): Promise<RedditCommentResponse> {
    try {
      const { id, text, sendreplies = true } = params;

      if (!id) {
        throw new RedditError("id is required for sending comments", "VALIDATION_ERROR");
      }

      if (!text) {
        throw new RedditError("text is required for sending comments", "VALIDATION_ERROR");
      }

      // Validate ID format
      if (!/^t[1|3]_[a-z0-9]+$/.test(id)) {
        throw new RedditError(
          "Invalid ID format. Must start with t1_ for comments or t3_ for posts",
          "VALIDATION_ERROR",
        );
      }

      return this.postService.sendComment(params.id, params.text);
    } catch (error) {
      throw error;
    }
  }

  public async sendMessage(params: RedditMessageParams): Promise<RedditMessageResponse> {
    this.checkInitialized();

    try {
      const { recipient, subject, content } = params;

      if (!recipient || !subject || !content) {
        throw new RedditError("Missing required fields", "VALIDATION_ERROR");
      }

      // Validate subject length
      if (subject.length > 100) {
        throw new RedditError(
          "Subject exceeds maximum length of 100 characters",
          "VALIDATION_ERROR",
        );
      }

      // Validate content length
      if (content.length > 10000) {
        throw new RedditError(
          "Content exceeds maximum length of 10000 characters",
          "VALIDATION_ERROR",
        );
      }

      return this.postService.sendMessage(params);
    } catch (error) {
      throw error;
    }
  }

  private checkInitialized() {
    if (!this.initialized) {
      throw new RedditError(
        "RedditService not initialized. Call initialize() first",
        "INITIALIZATION_ERROR",
      );
    }
  }
}
