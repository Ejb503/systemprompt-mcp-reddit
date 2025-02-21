import { RedditServiceConfig, RedditAuthResponse } from "../../types/reddit.js";
import { RedditError } from "../../errors/reddit-error.js";

export class RedditAuthService {
  private accessToken = "";
  private tokenExpiry = 0;
  private userAgent: string;

  constructor(private readonly config: RedditServiceConfig) {
    this.userAgent = `${config.appName}:${config.appVersion} (by /u/${config.username})`;
  }

  public async initialize(): Promise<void> {
    await this.refreshToken();
  }

  public async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshToken();
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
      "User-Agent": this.userAgent,
      Accept: "application/json",
    };
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": this.userAgent,
        },
        body: `grant_type=refresh_token&refresh_token=${this.config.refreshToken}`,
      });

      const data = (await response.json()) as RedditAuthResponse;

      if (!response.ok || data.error) {
        throw new RedditError(`Auth failed: ${data.error || response.statusText}`, "AUTH_ERROR");
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      if (error instanceof RedditError) throw error;
      throw new RedditError(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "AUTH_ERROR",
        error,
      );
    }
  }
}
