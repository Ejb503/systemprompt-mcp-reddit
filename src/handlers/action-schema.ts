import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import { JSONSchema7 } from "json-schema";
import {
  REDDIT_POST_RESPONSE_SCHEMA,
  REDDIT_COMMENT_RESPONSE_SCHEMA,
  REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA,
} from "@/types/sampling-schemas.js";

// Constants for resource types and actions
export const RESOURCE_TYPES = {
  POST: "reddit_post",
  COMMENT: "reddit_comment",
  INSTRUCTIONS: "reddit_instructions",
  ANALYSIS: "reddit_subreddit_analysis",
} as const;

export const ACTIONS = {
  CREATE_REDDIT_POST: "create_reddit_post",
  CREATE_REDDIT_COMMENT: "create_reddit_comment",
  DELETE_REDDIT_CONTENT: "delete_reddit_content",
  CONFIGURE_REDDIT_INSTRUCTIONS: "configure_reddit_instructions",
  SEND_REDDIT_POST: "send_reddit_post",
  SEND_REDDIT_COMMENT: "send_reddit_comment",
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
  [RESOURCE_TYPES.INSTRUCTIONS]: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Instructions for content generation and interaction with Reddit",
      },
    },
    required: ["content"],
  },
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

  if (availableActions.includes(ACTIONS.DELETE_REDDIT_CONTENT)) {
    schemas[ACTIONS.DELETE_REDDIT_CONTENT] = {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the resource to delete" },
      },
      required: ["id"],
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

  if (availableActions.includes(ACTIONS.CONFIGURE_REDDIT_INSTRUCTIONS)) {
    schemas[ACTIONS.CONFIGURE_REDDIT_INSTRUCTIONS] = {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Instructions for content generation and interaction with Reddit",
        },
      },
      required: ["content"],
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

  return schemas;
};

// Helper to get available actions based on resource type
export const getAvailableActions = (resourceType: string): string[] => {
  const baseActions = [ACTIONS.DELETE_REDDIT_CONTENT];

  switch (resourceType) {
    case RESOURCE_TYPES.POST:
      return [ACTIONS.SEND_REDDIT_POST, ...baseActions];
    case RESOURCE_TYPES.COMMENT:
      return [ACTIONS.SEND_REDDIT_COMMENT, ...baseActions];
    case RESOURCE_TYPES.INSTRUCTIONS:
      return [ACTIONS.CONFIGURE_REDDIT_INSTRUCTIONS, ...baseActions];
    case RESOURCE_TYPES.ANALYSIS:
      return [ACTIONS.VIEW_REDDIT_ANALYSIS, ...baseActions];
    default:
      return baseActions;
  }
};

// Helper to check if a block is a Reddit resource
export const isRedditResource = (block: SystempromptBlockResponse): boolean =>
  block.prefix === RESOURCE_TYPES.POST ||
  block.prefix === RESOURCE_TYPES.COMMENT ||
  block.prefix === RESOURCE_TYPES.INSTRUCTIONS;

// Type assertion helper for Reddit post arguments
export const assertRedditPostArgs = (args: unknown): RedditPostArgs => {
  const typedArgs = args as RedditPostArgs;

  if (!typedArgs.subreddit || !typedArgs.title) {
    throw new Error("Invalid Reddit post arguments: missing required fields");
  }

  return typedArgs;
};

// Type assertion helper for Reddit reply arguments
export const assertRedditReplyArgs = (args: unknown): RedditReplyArgs => {
  const typedArgs = args as RedditReplyArgs;

  if (!typedArgs.id || !typedArgs.content) {
    throw new Error("Invalid Reddit reply arguments: missing required fields");
  }

  return typedArgs;
};
