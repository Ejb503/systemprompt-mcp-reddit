import { RedditServiceConfig, RedditError } from "@/types/reddit.js";

export class RedditAuthService {
  private readonly tokenEndpoint = "https://www.reddit.com/api/v1/access_token";
  private readonly userAgent: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(private readonly config: RedditServiceConfig) {
    this.userAgent = `${config.appName}/${config.appVersion} by ${config.username}`;
  }

  public async initialize(): Promise<void> {
    await this.refreshAccessToken();
  }

  public async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "User-Agent": this.userAgent,
      Accept: "application/json",
    };
  }

  public async getAccessToken(): Promise<string> {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken!;
  }

  public async fetchUserInfo() {
    const token = await this.getAccessToken();
    const response = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new RedditError(`Failed to fetch user info: ${response.statusText}`, "API_ERROR");
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      created_utc: data.created_utc,
      comment_karma: data.comment_karma,
      link_karma: data.link_karma,
      is_gold: data.is_gold,
      is_mod: data.is_mod,
      has_verified_email: data.has_verified_email,
    };
  }

  public async fetchUserPreferences() {
    const token = await this.getAccessToken();
    const response = await fetch("https://oauth.reddit.com/api/v1/me/prefs", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new RedditError(
        `Failed to fetch user preferences: ${response.statusText}`,
        "API_ERROR",
      );
    }

    const prefs = await response.json();
    return {
      enable_notifications: prefs.enable_notifications ?? true,
      show_nsfw: prefs.over_18 ?? false,
      default_comment_sort: prefs.default_comment_sort ?? "best",
      theme: prefs.theme ?? "dark",
      language: prefs.language ?? "en",
    };
  }

  private isTokenExpired(): boolean {
    return !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt;
  }

  private async refreshAccessToken(): Promise<void> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
      "base64",
    );

    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.userAgent,
      },
      body: `grant_type=refresh_token&refresh_token=${this.config.refreshToken}`,
    });

    if (!response.ok) {
      throw new RedditError(`Failed to refresh access token: ${response.statusText}`, "AUTH_ERROR");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }
}
