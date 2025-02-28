import {
  RedditPost,
  RedditServiceConfig,
  RedditError,
  RedditPostParams,
  RedditPostResponse,
  FetchPostsOptions,
  RedditPostWithComments,
  RedditNotification as ApiRedditNotification,
  FetchNotificationsOptions,
  FetchSubscribedSubredditsOptions,
  SubscribedSubreddit,
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
      appName: "RedditBot",
      appVersion: "1.0.0",
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
   */
  public async createPost(params: RedditPostParams): Promise<RedditPostResponse> {
    this.checkInitialized();
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

  private checkInitialized() {
    if (!this.initialized) {
      throw new RedditError(
        "RedditService not initialized. Call initialize() first",
        "INITIALIZATION_ERROR",
      );
    }
  }
}
