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
} from "@/types/reddit.js";
import type {
  RedditConfigData,
  RedditNotification as ConfigRedditNotification,
  SubredditInfo,
} from "../../types/config.js";
import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditPostService } from "./reddit-post-service.js";
import { RedditSubredditService } from "./reddit-subreddit-service.js";
import { transformToConfigNotification } from "../../utils/reddit-transformers.js";

/**
 * Main service for interacting with the Reddit API
 * Implements facade pattern to coordinate between specialized services
 */
export class RedditService {
  private static instance: RedditService;
  private readonly baseUrl = "https://oauth.reddit.com";
  private readonly rateLimitDelay = 1000; // 1 request per second
  private initialized = false;

  private authService: RedditAuthService;
  private postService: RedditPostService;
  private subredditService: RedditSubredditService;

  private constructor() {
    const config = this.loadConfig();
    this.authService = new RedditAuthService(config);
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
   * Initialize the service and authenticate
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
   * Fetches posts based on provided options
   */
  public async fetchPosts(options: FetchPostsOptions): Promise<RedditPost[]> {
    this.checkInitialized();
    if (!options.subreddits?.length) {
      return this.postService.fetchPosts(options);
    }

    const promises = options.subreddits.map((subreddit: string) => {
      return this.postService.fetchPosts({
        subreddits: [subreddit],
        ...options,
      });
    });
    return Promise.all(promises).then((results) => results.flat());
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

    // Validate content based on post type
    if (params.kind === "self" && (!params.content || params.content.length === 0)) {
      throw new RedditError("Content is required for text posts", "VALIDATION_ERROR");
    }
    if (params.kind === "link" && (!params.url || !params.url.startsWith("http"))) {
      throw new RedditError("Valid URL is required for link posts", "VALIDATION_ERROR");
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
   * @param postId The ID of the post to fetch
   * @returns The fetched post with comments
   */
  public async fetchPostById(postId: string): Promise<RedditPostWithComments> {
    this.checkInitialized();
    return this.postService.fetchPostById(postId);
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
    return this.postService.fetchNotifications(options);
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
  private formatNotification(notification: ApiRedditNotification): ConfigRedditNotification {
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
      const [notifications, subscribedSubreddits, userInfo, userPreferences] = await Promise.all([
        this.fetchNotifications({ filter: "all", limit: 10, markRead: false }),
        this.fetchSubscribedSubreddits({ limit: 50 }),
        this.fetchUserInfo(),
        this.fetchUserPreferences(),
      ]);

      // Format the data according to our schema
      return {
        notifications: notifications.map((n) => this.formatNotification(n)),
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
   * @param commentId The ID of the comment to fetch
   * @returns The fetched comment
   */
  public async fetchCommentById(commentId: string): Promise<RedditComment> {
    this.checkInitialized();
    return this.postService.fetchCommentById(commentId);
  }

  /**
   * Fetches a comment thread (comment with all its replies)
   * @param postId The ID of the post containing the comment
   * @param commentId The ID of the comment to fetch
   * @returns The comment thread with all replies
   */
  public async fetchCommentThread(postId: string, commentId: string): Promise<RedditCommentThread> {
    this.checkInitialized();
    return this.postService.fetchCommentThread(postId, commentId);
  }

  /**
   * Sends a reply to a post or comment
   * @param params Reply parameters including parent ID and text
   * @throws {RedditError} if reply fails or validation fails
   */
  public async sendReply(params: RedditReplyParams): Promise<RedditReplyResponse> {
    this.checkInitialized();

    // Validate parent_id format
    if (!params.parent_id.match(/^t[1|3]_[a-z0-9]+$/i)) {
      throw new RedditError(
        "Invalid parent_id format. Must start with t1_ for comments or t3_ for posts",
        "VALIDATION_ERROR",
      );
    }

    // Validate text length (Reddit's limit is 10000 characters)
    if (!params.text || params.text.length === 0 || params.text.length > 10000) {
      throw new RedditError(
        "Reply text must be between 1 and 10000 characters",
        "VALIDATION_ERROR",
      );
    }

    return this.postService.sendReply(params.parent_id, params.text);
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
