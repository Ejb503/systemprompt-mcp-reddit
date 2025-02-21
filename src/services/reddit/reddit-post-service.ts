import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditTransformService } from "./reddit-transform-service.js";
import { RedditError } from "../../errors/reddit-error.js";
import {
  RedditPost,
  RedditPostParams,
  RedditPostResponse,
  RedditApiResponse,
  FetchPostsOptions,
} from "../../types/reddit.js";
import { RedditFetchService } from "./reddit-fetch-service.js";

export class RedditPostService extends RedditFetchService {
  constructor(
    baseUrl: string,
    authService: RedditAuthService,
    private readonly transformService: RedditTransformService,
    rateLimitDelay: number,
  ) {
    super(baseUrl, authService, rateLimitDelay);
  }

  public async fetchPosts(options: FetchPostsOptions): Promise<RedditPost[]> {
    try {
      const limit = options.limit || 10;

      // If multiple subreddits provided, fetch from each and combine results
      if (options.subreddits && options.subreddits.length > 0) {
        const promises = options.subreddits.map((subreddit: string) => {
          switch (options.sort) {
            case "hot":
              return this.getHotPosts(subreddit, limit);
            case "new":
              return this.getNewPosts(subreddit, limit);
            case "controversial":
              return this.getControversialPosts(subreddit, limit);
            default:
              throw new RedditError(`Unsupported sort type: ${options.sort}`, "VALIDATION_ERROR");
          }
        });

        const results = await Promise.all(promises);
        const posts = results.flat();

        // Sort combined results by score and limit to requested amount
        posts.sort((a, b) => b.score - a.score);
        return posts.slice(0, limit);
      }

      // No specific subreddits, fetch from all
      switch (options.sort) {
        case "hot":
          return this.getHotPosts(undefined, limit);
        case "new":
          return this.getNewPosts(undefined, limit);
        case "controversial":
          return this.getControversialPosts(undefined, limit);
        default:
          throw new RedditError(`Unsupported sort type: ${options.sort}`, "VALIDATION_ERROR");
      }
    } catch (error) {
      throw new RedditError(
        `Failed to fetch posts: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }

  public async createPost(params: RedditPostParams): Promise<RedditPostResponse> {
    try {
      const formData = new URLSearchParams({
        sr: params.subreddit,
        title: params.title,
        kind: params.kind === "link" ? "link" : "self",
        ...(params.kind === "link" ? { url: params.url || "" } : { text: params.content || "" }),
      });

      const response = await this.redditFetch<{
        json: {
          data: {
            id: string;
            url: string;
          };
        };
      }>("/api/submit", {
        method: "POST",
        body: formData,
      });

      return {
        id: response.json.data.id,
        url: response.json.data.url,
        title: params.title,
        subreddit: params.subreddit,
      };
    } catch (error) {
      throw new RedditError(
        `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }

  private async getHotPosts(subreddit?: string, limit: number = 10): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/hot.json?limit=${limit}`
      : `/hot.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return (
      data.data.children?.map((child) => this.transformService.transformPost(child.data)) ?? []
    );
  }

  private async getNewPosts(subreddit?: string, limit: number = 10): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/new.json?limit=${limit}`
      : `/new.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return (
      data.data.children?.map((child) => this.transformService.transformPost(child.data)) ?? []
    );
  }

  private async getControversialPosts(
    subreddit?: string,
    limit: number = 10,
  ): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/controversial.json?limit=${limit}`
      : `/controversial.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return (
      data.data.children?.map((child) => this.transformService.transformPost(child.data)) ?? []
    );
  }

  private formatSubreddit(subreddit?: string): string {
    return subreddit?.trim().replace(/^r\//, "") ?? "";
  }
}
