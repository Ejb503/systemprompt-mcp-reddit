export interface RedditNotification {
  id: string;
  type: string;
  created_utc: number;
  subreddit: string;
  title?: string;
  body?: string;
  author: string;
  permalink: string;
  unread: boolean;
}

export interface SubredditInfo {
  id: string;
  name: string;
  display_name: string;
  title: string;
  description: string;
  subscribers: number;
  created_utc: number;
  url: string;
  over18: boolean;
  icon_img?: string;
  user_is_subscriber: boolean;
  user_is_moderator: boolean;
  rules?: SubredditRule[];
  post_requirements?: PostRequirements;
}

export interface SubredditRule {
  kind: string;
  description: string;
  short_name: string;
  violation_reason: string;
  created_utc: number;
  priority: number;
}

export interface PostRequirements {
  title_regexes: string[];
  body_regexes: string[];
  title_blacklisted_strings: string[];
  body_blacklisted_strings: string[];
  title_required_strings: string[];
  body_required_strings: string[];
  is_flair_required: boolean;
  domain_blacklist: string[];
  domain_whitelist: string[];
  min_combined_karma: number;
  account_age_min_days: number;
}

export interface UserPreferences {
  enable_notifications: boolean;
  show_nsfw: boolean;
  default_comment_sort: "best" | "top" | "new" | "controversial" | "old" | "qa";
  theme: "light" | "dark" | "auto";
  language: string;
}

export interface UserInfo {
  id: string;
  name: string;
  created_utc: number;
  comment_karma: number;
  link_karma: number;
  is_gold: boolean;
  is_mod: boolean;
  has_verified_email: boolean;
  preferences: UserPreferences;
}

export interface SearchFilters {
  time?: "hour" | "day" | "week" | "month" | "year" | "all";
  sort?: "relevance" | "hot" | "top" | "new" | "comments";
  type?: "link" | "self" | "image" | "video";
  restrict_sr?: boolean; // Restrict to subreddit
  include_over_18?: boolean;
  limit?: number;
}

export interface PostSearchResult {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
  url: string;
  is_self: boolean;
  is_video: boolean;
  thumbnail?: string;
  selftext?: string;
  flair?: {
    text: string;
    background_color: string;
    text_color: string;
  };
}

export interface UserSearchResult {
  id: string;
  name: string;
  created_utc: number;
  comment_karma: number;
  link_karma: number;
  is_gold: boolean;
  is_mod: boolean;
  verified: boolean;
  profile_img?: string;
  description?: string;
}

export interface SubredditSearchResult {
  id: string;
  name: string;
  display_name: string;
  title: string;
  description: string;
  subscribers: number;
  created_utc: number;
  over18: boolean;
  user_is_subscriber: boolean;
  icon_img?: string;
  banner_img?: string;
  primary_color?: string;
  active_user_count?: number;
}

export interface SearchResults {
  query: string;
  filters: SearchFilters;
  posts?: {
    results: PostSearchResult[];
    total_count: number;
    next_page_token?: string;
  };
  subreddits?: {
    results: SubredditSearchResult[];
    total_count: number;
    next_page_token?: string;
  };
  users?: {
    results: UserSearchResult[];
    total_count: number;
    next_page_token?: string;
  };
}

export interface RedditConfigData {
  notifications: RedditNotification[];
  subscribedSubreddits: SubredditInfo[];
  user: UserInfo;
}

// Mock data for testing and development
export const mockRedditConfig: RedditConfigData = {
  notifications: [
    {
      id: "abc123",
      type: "comment_reply",
      created_utc: 1647532800,
      subreddit: "programming",
      body: "Thanks for your helpful comment!",
      author: "user123",
      permalink: "/r/programming/comments/abc123",
      unread: true,
    },
    {
      id: "def456",
      type: "post_reply",
      created_utc: 1647529200,
      subreddit: "typescript",
      title: "Question about interfaces",
      body: "This solved my problem, thank you!",
      author: "typescript_fan",
      permalink: "/r/typescript/comments/def456",
      unread: false,
    },
  ],
  subscribedSubreddits: [
    {
      id: "xyz789",
      name: "t5_2fwo",
      display_name: "programming",
      title: "Programming",
      description: "Computer Programming",
      subscribers: 3500000,
      created_utc: 1201832000,
      url: "/r/programming/",
      over18: false,
      icon_img: "https://styles.redditmedia.com/t5_2fwo/styles/communityIcon_1bqa1ibfp8q11.png",
      user_is_subscriber: true,
      user_is_moderator: false,
      rules: [
        {
          kind: "link",
          description: "Please keep submissions on topic and of high quality",
          short_name: "On Topic & Quality",
          violation_reason: "Off-topic or low quality",
          created_utc: 1201832000,
          priority: 1,
        },
      ],
      post_requirements: {
        title_regexes: [],
        body_regexes: [],
        title_blacklisted_strings: [],
        body_blacklisted_strings: [],
        title_required_strings: [],
        body_required_strings: [],
        is_flair_required: true,
        domain_blacklist: [],
        domain_whitelist: [],
        min_combined_karma: 10,
        account_age_min_days: 30,
      },
    },
  ],
  user: {
    id: "t2_user123",
    name: "example_user",
    created_utc: 1546300800,
    comment_karma: 1500,
    link_karma: 1000,
    is_gold: false,
    is_mod: false,
    has_verified_email: true,
    preferences: {
      enable_notifications: true,
      show_nsfw: false,
      default_comment_sort: "best",
      theme: "dark",
      language: "en",
    },
  },
};
