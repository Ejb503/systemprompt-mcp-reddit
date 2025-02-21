export type RedditErrorType =
  | "CONFIGURATION_ERROR"
  | "INITIALIZATION_ERROR"
  | "AUTH_ERROR"
  | "API_ERROR"
  | "RATE_LIMIT_ERROR"
  | "VALIDATION_ERROR";

export class RedditError extends Error {
  constructor(
    message: string,
    public readonly type: RedditErrorType,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RedditError";
  }
}
