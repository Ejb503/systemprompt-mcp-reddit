import { RedditAuthService } from "./reddit-auth-service.js";
import {
  RedditApiResponse,
  RedditSubreddit,
  SubredditRulesResponse,
  SubredditRequirements,
  FetchSubscribedSubredditsOptions,
  SubscribedSubreddit,
  RedditError,
} from "@/types/reddit.js";
import { RedditFetchService } from "./reddit-fetch-service.js";
import {
  transformSubreddit,
  transformSubscribedSubreddit,
} from "../../utils/reddit-transformers.js";

export class RedditSubredditService extends RedditFetchService {
  constructor(baseUrl: string, authService: RedditAuthService, rateLimitDelay: number) {
    super(baseUrl, authService, rateLimitDelay);
  }

  public async getSubredditInfo(subreddit: string): Promise<SubredditRequirements> {
    try {
      const [aboutData, rulesData] = await Promise.all([
        this.redditFetch<RedditApiResponse<RedditSubreddit>>(`/r/${subreddit}/about.json`),
        this.redditFetch<SubredditRulesResponse>(`/r/${subreddit}/about/rules.json`),
      ]);

      const subredditData = transformSubreddit({
        ...aboutData.data,
        rules: rulesData.rules,
      });

      return {
        allowedPostTypes: subredditData.allowedPostTypes,
        rules: subredditData.rules,
        titleRequirements: subredditData.postRequirements.title,
        bodyRequirements: subredditData.postRequirements.body,
        flairRequired: subredditData.postRequirements.flairRequired,
      };
    } catch (error) {
      throw new RedditError(
        `Failed to fetch subreddit info: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }

  /**
   * Fetches the list of subreddits the authenticated user is subscribed to
   * @param options Options for fetching subscribed subreddits
   * @returns Array of subscribed subreddits
   */
  public async fetchSubscribedSubreddits(
    options: FetchSubscribedSubredditsOptions = {},
  ): Promise<SubscribedSubreddit[]> {
    try {
      const limit = options.limit || 100;
      let endpoint = `/subreddits/mine/subscriber.json?limit=${limit}`;

      if (options.after) {
        endpoint += `&after=${options.after}`;
      }

      const data = await this.redditFetch<RedditApiResponse<Record<string, unknown>>>(endpoint);
      return (data.data.children || []).map((item) => transformSubscribedSubreddit(item.data));
    } catch (error) {
      throw new RedditError(
        `Failed to fetch subscribed subreddits: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }
}
