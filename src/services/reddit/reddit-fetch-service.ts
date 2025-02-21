import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditError } from "../../errors/reddit-error.js";

export abstract class RedditFetchService {
  constructor(
    private readonly baseUrl: string,
    private readonly authService: RedditAuthService,
    private readonly rateLimitDelay: number,
  ) {}

  protected async redditFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.authService.getAuthHeaders();

    // Add rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Handle rate limiting
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return this.redditFetch<T>(endpoint, options);
      }

      const errorData = await response.json().catch(() => null);
      throw new RedditError(
        `Reddit API error: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ""
        }`,
        "API_ERROR",
        errorData,
      );
    }

    return response.json();
  }
}
