import { JSONSchema7 } from "json-schema";

export const REDDIT_POST_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Post title (1-300 characters)",
      minLength: 1,
      maxLength: 300,
    },
    content: {
      type: "string",
      description: "Text content for the post",
    },
    subreddit: {
      type: "string",
      description: "Subreddit to post to (without r/ prefix)",
    },
    flair_id: {
      type: "string",
      description: "Flair ID if the subreddit requires it",
    },
    flair_text: {
      type: "string",
      description: "Flair text if the subreddit requires it",
    },
    sendreplies: {
      type: "boolean",
      description: "Whether to send replies to inbox",
      default: true,
    },
    nsfw: {
      type: "boolean",
      description: "Whether to mark as NSFW",
      default: false,
    },
    spoiler: {
      type: "boolean",
      description: "Whether to mark as spoiler",
      default: false,
    },
  },
  required: ["title", "content", "subreddit"],
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

export const REDDIT_MESSAGE_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    recipient: {
      type: "string",
      description: "Username of the message recipient",
    },
    subject: {
      type: "string",
      description: "Subject line of the message (1-100 chars)",
      minLength: 1,
      maxLength: 100,
    },
    content: {
      type: "string",
      description: "Message content in markdown format (max 10000 chars)",
      maxLength: 10000,
    },
  },
  required: ["recipient", "subject", "content"],
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

export const REDDIT_INSTRUCTIONS_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "Instructions for content generation and interaction with Reddit",
    },
  },
  required: ["content"],
};
