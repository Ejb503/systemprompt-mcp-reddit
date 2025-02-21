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

export interface RedditInstructionConfig {
  tones: Array<string>;
  vocabularyLevel: "simple" | "moderate" | "advanced" | "technical" | "mixed";
  useEmoji?: boolean;
  useSlang?: boolean;
  useMemes?: boolean;
  culturalContexts?: string[];
  introStyle?: string;
  maxParagraphLength?: number;
  minPostLength: number;
  maxPostLength: number;
  requireSources?: boolean;
  factCheckLevel: "none" | "basic" | "thorough";
  debateStyle: "avoid" | "gentle" | "factual" | "socratic";
  agreeableLevel?: "very" | "moderate" | "neutral" | "challenging";
  participationStyle: "observer" | "contributor" | "active" | "leader";
  coreValues?: string[];
  expertise?: string[];
  backgroundContext?: string;
}
