import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditTransformService } from "./reddit-transform-service.js";
import { RedditError } from "../../errors/reddit-error.js";
import {
  RedditApiResponse,
  RedditSubreddit,
  SubredditRulesResponse,
  SubredditRequirements,
} from "../../types/reddit.js";
import { RedditFetchService } from "./reddit-fetch-service.js";

export class RedditSubredditService extends RedditFetchService {
  constructor(
    baseUrl: string,
    authService: RedditAuthService,
    private readonly transformService: RedditTransformService,
    rateLimitDelay: number,
  ) {
    super(baseUrl, authService, rateLimitDelay);
  }

  public async getSubredditInfo(subreddit: string): Promise<SubredditRequirements> {
    try {
      const [aboutData, rulesData] = await Promise.all([
        this.redditFetch<RedditApiResponse<RedditSubreddit>>(`/r/${subreddit}/about.json`),
        this.redditFetch<SubredditRulesResponse>(`/r/${subreddit}/about/rules.json`),
      ]);

      const subredditData = this.transformService.transformSubreddit({
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
}
