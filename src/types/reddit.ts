export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  selftext?: string;
  url?: string;
  score: number;
  createdUtc: number;
  numComments: number;
  permalink: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  createdUtc: number;
  permalink: string;
}

export interface RedditUser {
  name: string;
  createdUtc: number;
  commentKarma: number;
  linkKarma: number;
  isMod: boolean;
}

export interface RedditSubreddit {
  displayName: string;
  title: string;
  publicDescription: string;
  subscribers: number;
  createdUtc: number;
  over18: boolean;
  allowedPostTypes: string[];
  rules: Array<{
    title: string;
    description: string;
  }>;
  postRequirements: {
    title?: {
      minLength?: number;
      maxLength?: number;
      allowedPrefixes?: string[];
      bannedPhrases?: string[];
    };
    body?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
    };
    flairRequired?: boolean;
  };
}

export interface RedditApiResponse<T> {
  kind: string;
  data: {
    children?: Array<{
      kind: string;
      data: T;
    }>;
    [key: string]: any;
  };
}

export interface FetchPostsOptions {
  sort: "hot" | "new" | "controversial";
  timeFilter?: string;
  limit?: number;
  subreddits?: string[];
}

export interface RedditServiceConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  appName: string;
  appVersion: string;
  username: string;
}

export interface RedditAuthResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

export interface RedditPostParams {
  subreddit: string;
  title: string;
  kind: "text" | "link";
  content?: string;
  url?: string;
}

export interface RedditPostResponse {
  id: string;
  url: string;
  title: string;
  subreddit: string;
}

export interface SubredditRulesResponse {
  rules: Array<{
    short_name: string;
    description: string;
  }>;
}

export interface SubredditRequirements {
  allowedPostTypes: string[];
  rules: Array<{
    title: string;
    description: string;
  }>;
  titleRequirements?: {
    minLength?: number;
    maxLength?: number;
    allowedPrefixes?: string[];
    bannedPhrases?: string[];
  };
  bodyRequirements?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
  flairRequired?: boolean;
}
