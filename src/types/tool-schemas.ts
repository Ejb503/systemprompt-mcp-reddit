export interface RedditSubredditConfig {
  name: string;
  description?: string;
  tags?: string[];
}

export interface RedditPreferences {
  defaultSort?: "hot" | "new" | "top" | "rising" | "controversial";
  timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
  contentFilter?: "all" | "posts" | "comments";
  nsfwFilter?: boolean;
  minimumScore?: number;
  maxPostsPerRequest?: number;
}

export interface ConfigureRedditArgs {
  subreddits: string[];
  preferences?: {
    defaultSort?: "hot" | "new" | "top" | "rising" | "controversial";
    timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
    contentFilter?: "all" | "posts" | "comments";
    nsfwFilter?: boolean;
    minimumScore?: number;
    maxPostsPerRequest?: number;
  };
}

export interface FetchRedditContentArgs {
  sortBy: "hot" | "new" | "top" | "rising" | "controversial";
  timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
  limit?: number;
  subreddits?: string;
}

export interface ConfigureInstructionsArgs {
  content: string;
}

export interface CreateRedditPostArgs {
  subreddit: string;
  content: string;
  kind?: "text" | "link";
  url?: string;
}

export interface CreateRedditReplyArgs {
  subreddit: string;
  messageId: string;
  content: string;
}
