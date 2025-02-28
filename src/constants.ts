export const REDDIT_BASE_URL = "https://oauth.reddit.com";
export const REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/access_token";
export const DEFAULT_RATE_LIMIT_DELAY = 1000; // 1 second
export const DEFAULT_POST_LIMIT = 25;
export const DEFAULT_COMMENT_LIMIT = 100;
export const DEFAULT_NOTIFICATION_LIMIT = 25;
export const DEFAULT_SUBREDDIT_LIMIT = 100;

// Error messages
export const ERROR_MESSAGES = {
  MISSING_CONFIG: "Reddit configuration is missing or invalid",
  INVALID_AUTH: "Invalid Reddit authentication credentials",
  RATE_LIMIT: "Reddit API rate limit exceeded",
  API_ERROR: "Reddit API request failed",
  VALIDATION_ERROR: "Invalid request parameters",
} as const;
