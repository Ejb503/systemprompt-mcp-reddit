import { JSONSchema7 } from "json-schema";

export const REDDIT_POST_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Generated title for the post",
    },
    content: {
      type: "string",
      description: "Generated content for the post",
    },
    kind: {
      type: "string",
      enum: ["self", "link"],
      description: "Type of post",
    },
    subreddit: {
      type: "string",
      description: "Subreddit to post to",
    },
    url: {
      type: "string",
      description: "URL for link posts",
    },
  },
  required: ["title", "content", "kind", "subreddit"],
};

export const REDDIT_COMMENT_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "Generated content for the reply",
    },
    id: {
      type: "string",
      description: "ID of parent post/comment being replied to",
    },
    subreddit: {
      type: "string",
      description: "Subreddit where the comment will be posted",
    },
  },
  required: ["content", "id", "subreddit"],
};

export const REDDIT_SUGGEST_ACTION_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    action: {
      type: "string",
      description: "Suggested action to take (e.g., 'create_post', 'reply', 'wait')",
    },
    subreddit: {
      type: "string",
      description: "Suggested subreddit for the action",
    },
    reasoning: {
      type: "string",
      description: "Explanation for why this action is suggested",
    },
    content: {
      type: "string",
      description: "Suggested content or topic for the action",
    },
    id: {
      type: "string",
      description: "ID of parent post/comment to reply to (if action is 'reply')",
    },
  },
  required: ["action", "reasoning"],
};

export const REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    subreddit: {
      type: "string",
      description: "Name of the analyzed subreddit",
    },
    summary: {
      type: "string",
      description: "Overall summary of the subreddit's current state",
    },
    trendingTopics: {
      type: "array",
      description: "List of trending topics in the subreddit",
      items: {
        type: "string",
      },
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "mixed"],
      description: "Overall sentiment of the subreddit",
    },
    recommendedActions: {
      type: "array",
      description: "Recommended actions based on the analysis",
      items: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Recommended action",
          },
          reason: {
            type: "string",
            description: "Reason for the recommendation",
          },
        },
        required: ["action", "reason"],
      },
    },
  },
  required: ["subreddit", "summary", "trendingTopics", "sentiment", "recommendedActions"],
};
