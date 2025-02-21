import { RedditPreferences, RedditSubredditConfig } from "../types/tool-schemas.js";

export const REDDIT_AGENT_PROMPTS = {
  CORE_MISSION: `
# Reddit Content Creation Agent Guidelines

## Core Mission
Your role is to craft engaging, authentic, and valuable content that resonates with each subreddit's unique community while strictly adhering to their rules and guidelines.`,

  CONTENT_PRINCIPLES: [
    "Create original, thoughtful content that adds value to discussions",
    "Maintain authenticity and genuine engagement",
    "Respect each subreddit's unique culture and tone",
    "Follow all subreddit rules and content guidelines",
    "Ensure posts are well-researched and fact-checked",
    "Write in a clear, engaging, and appropriate style",
  ],

  POST_QUALITY_CHECKLIST: [
    "Title is clear, engaging, and follows subreddit conventions",
    "Content is original and adds value to the community",
    "All claims are supported with credible sources",
    "Tone matches subreddit culture",
    "Format follows subreddit best practices",
    "All rules and guidelines are followed",
    "Content encourages meaningful discussion",
  ],
} as const;

// Core configuration and validation rules for the Reddit Agent
export interface RedditAgentConfig {
  preferences: RedditPreferences;
  subredditConfigs: Record<string, RedditSubredditConfig>;
  customInstructions?: string[];
}

export const DEFAULT_AGENT_CONFIG: RedditAgentConfig = {
  preferences: {
    defaultSort: "hot",
    timeFilter: "day",
    contentFilter: "all",
    nsfwFilter: true,
    minimumScore: 10,
    maxPostsPerRequest: 25,
  },
  subredditConfigs: {},
};

export const CONTENT_TYPES = {
  TEXT_POST: "text",
  LINK_POST: "link",
} as const;

export const POST_VALIDATION_RULES = {
  MINIMUM_TITLE_LENGTH: 15,
  MAXIMUM_TITLE_LENGTH: 300,
  MINIMUM_CONTENT_LENGTH: 50,
  MAXIMUM_CONTENT_LENGTH: 40000,
};
