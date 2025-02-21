import {
  RedditPost,
  RedditServiceConfig,
  RedditAuthResponse,
  RedditPostParams,
  RedditPostResponse,
  FetchPostsOptions,
} from "../../types/reddit.js";
import { RedditError } from "../../errors/reddit-error.js";
import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditPostService } from "./reddit-post-service.js";
import { RedditSubredditService } from "./reddit-subreddit-service.js";
import { RedditTransformService } from "./reddit-transform-service.js";

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
  private transformService: RedditTransformService;

  private constructor() {
    const config = this.loadConfig();
    this.authService = new RedditAuthService(config);
    this.transformService = new RedditTransformService();
    this.postService = new RedditPostService(
      this.baseUrl,
      this.authService,
      this.transformService,
      this.rateLimitDelay,
    );
    this.subredditService = new RedditSubredditService(
      this.baseUrl,
      this.authService,
      this.transformService,
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

  private checkInitialized() {
    if (!this.initialized) {
      throw new RedditError(
        "RedditService not initialized. Call initialize() first",
        "INITIALIZATION_ERROR",
      );
    }
  }
}
