import {
  REDDIT_POST_RESPONSE_SCHEMA,
  REDDIT_COMMENT_RESPONSE_SCHEMA,
  REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA,
  REDDIT_MESSAGE_RESPONSE_SCHEMA,
} from '@reddit/types/sampling-schemas';
import type { JSONSchema7 } from "json-schema";

// Constants for resource types and actions
export const RESOURCE_TYPES = {
  POST: "reddit_post",
  COMMENT: "reddit_comment",
  ANALYSIS: "reddit_subreddit_analysis",
  MESSAGE: "reddit_message",
} as const;

export const ACTIONS = {
  CREATE_REDDIT_POST: "create_reddit_post",
  CREATE_REDDIT_COMMENT: "create_reddit_comment",
  CREATE_REDDIT_MESSAGE: "create_reddit_message",
  SEND_REDDIT_POST: "send_reddit_post",
  SEND_REDDIT_COMMENT: "send_reddit_comment",
  SEND_REDDIT_MESSAGE: "send_reddit_message",
  VIEW_REDDIT_ANALYSIS: "view_reddit_analysis",
} as const;

// Define the expected argument types to match ConfigureRedditArgs
interface RedditPostArgs {
  subreddit: string;
  title: string;
  content?: string;
}

interface RedditReplyArgs {
  id: string;
  content: string;
}

// Content schemas for different resource types
const contentSchemas: Record<string, JSONSchema7> = {
  [RESOURCE_TYPES.POST]: REDDIT_POST_RESPONSE_SCHEMA,
  [RESOURCE_TYPES.COMMENT]: REDDIT_COMMENT_RESPONSE_SCHEMA,
  [RESOURCE_TYPES.ANALYSIS]: REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA,
  [RESOURCE_TYPES.MESSAGE]: REDDIT_MESSAGE_RESPONSE_SCHEMA,
};

// Shared schemas for Reddit actions
export const getRedditSchemas = (resourceType: string): Record<string, JSONSchema7> => {
  const schemas: Record<string, JSONSchema7> = {
    content: contentSchemas[resourceType] || {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Content of the resource",
        },
      },
      required: ["content"],
    },
  };
  const availableActions = getAvailableActions(resourceType);

  if (availableActions.includes(ACTIONS.SEND_REDDIT_POST)) {
    schemas[ACTIONS.SEND_REDDIT_POST] = {
      type: "object",
      properties: {
        subreddit: { type: "string", description: "Subreddit to post to (without r/)" },
        content: { type: "string", description: "Instructions for generating the post content" },
      },
      required: ["subreddit", "content"],
      additionalProperties: false,
    } as JSONSchema7;
  }


  if (availableActions.includes(ACTIONS.CREATE_REDDIT_COMMENT)) {
    schemas[ACTIONS.CREATE_REDDIT_COMMENT] = {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the resource to edit" },
        content: { type: "string", description: "The new content for the resource" },
      },
      required: ["id", "content"],
      additionalProperties: false,
    } as JSONSchema7;
  }


  if (availableActions.includes(ACTIONS.SEND_REDDIT_COMMENT)) {
    schemas[ACTIONS.SEND_REDDIT_COMMENT] = {
      type: "object",
      properties: {
        subreddit: { type: "string", description: "Subreddit where the comment will be posted" },
        content: { type: "string", description: "Instructions for generating the comment content" },
        id: { type: "string", description: "ID of the parent post/comment to comment on" },
      },
      required: ["subreddit", "content", "id"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  if (availableActions.includes(ACTIONS.CREATE_REDDIT_MESSAGE)) {
    schemas[ACTIONS.CREATE_REDDIT_MESSAGE] = {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Username of the recipient" },
        subject: { type: "string", description: "Subject of the message" },
        content: { type: "string", description: "Content of the message" },
      },
      required: ["recipient", "subject", "content"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  return schemas;
};

// Helper to get available actions based on resource type
export const getAvailableActions = (resourceType: string): string[] => {
  switch (resourceType) {
    case RESOURCE_TYPES.POST:
      return [ACTIONS.SEND_REDDIT_POST];
    case RESOURCE_TYPES.COMMENT:
      return [ACTIONS.SEND_REDDIT_COMMENT];
    case RESOURCE_TYPES.ANALYSIS:
      return [ACTIONS.VIEW_REDDIT_ANALYSIS];
    case RESOURCE_TYPES.MESSAGE:
      return [ACTIONS.SEND_REDDIT_MESSAGE];
    default:
      return [];
  }
};

// Helper to check if a block is a Reddit resource (deprecated - no longer used)
export const isRedditResource = (prefix: string): boolean =>
  prefix === RESOURCE_TYPES.POST ||
  prefix === RESOURCE_TYPES.COMMENT ||
  prefix === RESOURCE_TYPES.ANALYSIS ||
  prefix === RESOURCE_TYPES.MESSAGE;

// Type assertion helper for Reddit post arguments
export const assertRedditPostArgs = (args: any): RedditPostArgs => {
  const typedArgs = args as RedditPostArgs;

  if (!typedArgs.subreddit || !typedArgs.title) {
    throw new Error("Invalid Reddit post arguments: missing required fields");
  }

  return typedArgs;
};

// Type assertion helper for Reddit reply arguments
export const assertRedditReplyArgs = (args: any): RedditReplyArgs => {
  const typedArgs = args as RedditReplyArgs;

  if (!typedArgs.id || !typedArgs.content) {
    throw new Error("Invalid Reddit reply arguments: missing required fields");
  }

  return typedArgs;
};
