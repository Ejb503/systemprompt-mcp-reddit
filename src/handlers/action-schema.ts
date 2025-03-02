import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import { JSONSchema7 } from "json-schema";

// Constants for resource types and actions
export const RESOURCE_TYPES = {
  POST: "reddit_post",
  REPLY: "reddit_reply",
  MESSAGE: "reddit_message",
  INSTRUCTIONS: "reddit_instructions",
} as const;

export const ACTIONS = {
  EDIT: "edit_block",
  DELETE: "delete_block",
  CREATE_POST: "send_post",
  CREATE_REPLY: "send_reply",
  CONFIGURE_INSTRUCTIONS: "configure_instructions",
  EDIT_CONTENT: "edit_content",
} as const;

// Define the expected argument types to match ConfigureRedditArgs
interface RedditPostArgs {
  subreddit: string;
  title: string;
  kind: "link" | "self";
  url?: string;
  content?: string;
}

interface RedditReplyArgs {
  postId: string;
  content: string;
}

// Shared schemas for Reddit actions
export const getRedditSchemas = (resourceType: string): Record<string, JSONSchema7> => {
  const schemas: Record<string, JSONSchema7> = {};
  const availableActions = getAvailableActions(resourceType);

  if (availableActions.includes(ACTIONS.CREATE_POST)) {
    schemas[ACTIONS.CREATE_POST] = {
      type: "object",
      properties: {
        subreddit: { type: "string", description: "Subreddit to post to (without r/)" },
        content: { type: "string", description: "Instructions for generating the post content" },
        postType: { type: "string", enum: ["self", "link"], description: "Type of post to create" },
      },
      required: ["subreddit", "content"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  if (availableActions.includes(ACTIONS.CREATE_REPLY)) {
    schemas[ACTIONS.CREATE_REPLY] = {
      type: "object",
      properties: {
        subreddit: { type: "string", description: "Subreddit where the reply will be posted" },
        content: { type: "string", description: "Instructions for generating the reply content" },
        parentId: { type: "string", description: "ID of the parent post/comment to reply to" },
        parentType: { type: "string", enum: ["comment", "post"], description: "Type of parent" },
      },
      required: ["subreddit", "content", "parentId", "parentType"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  if (availableActions.includes(ACTIONS.DELETE)) {
    schemas[ACTIONS.DELETE] = {
      type: "object",
      properties: {
        resourceId: { type: "string", description: "The ID of the resource to delete" },
        resourceType: {
          type: "string",
          enum: ["post", "reply", "comment", "block"],
          description: "The type of resource being deleted",
        },
      },
      required: ["resourceId", "resourceType"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  if (availableActions.includes(ACTIONS.EDIT_CONTENT)) {
    schemas[ACTIONS.EDIT_CONTENT] = {
      type: "object",
      properties: {
        resourceId: { type: "string", description: "The ID of the resource to edit" },
        resourceType: {
          type: "string",
          enum: ["post", "reply", "comment", "block"],
          description: "The type of resource being edited",
        },
        content: { type: "string", description: "The new content for the resource" },
      },
      required: ["resourceId", "resourceType", "content"],
      additionalProperties: false,
    } as JSONSchema7;
  }

  if (availableActions.includes(ACTIONS.CONFIGURE_INSTRUCTIONS)) {
    schemas[ACTIONS.CONFIGURE_INSTRUCTIONS] = {
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

  return schemas;
};

// Helper to create resource metadata
export const createResourceMetadata = (
  block: SystempromptBlockResponse,
): Record<string, unknown> => ({
  tag: ["agent"],
  schema: "mcp_systemprompt_reddit",
  resourceType: block.prefix,
});

// Helper to get available actions based on resource type
export const getAvailableActions = (resourceType: string): string[] => {
  const baseActions = [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.EDIT_CONTENT];

  // Map message type to appropriate action
  if (resourceType === RESOURCE_TYPES.POST || resourceType === RESOURCE_TYPES.MESSAGE) {
    return [...baseActions, ACTIONS.CREATE_POST];
  } else if (resourceType === RESOURCE_TYPES.REPLY) {
    return [...baseActions, ACTIONS.CREATE_REPLY];
  } else if (resourceType === RESOURCE_TYPES.INSTRUCTIONS) {
    return [...baseActions, ACTIONS.CONFIGURE_INSTRUCTIONS];
  }

  return baseActions;
};

// Helper to check if a block is a Reddit resource
export const isRedditResource = (block: SystempromptBlockResponse): boolean =>
  block.prefix === RESOURCE_TYPES.POST ||
  block.prefix === RESOURCE_TYPES.REPLY ||
  block.prefix === RESOURCE_TYPES.INSTRUCTIONS;

// Type assertion helper for Reddit post arguments
export const assertRedditPostArgs = (args: unknown): RedditPostArgs => {
  const typedArgs = args as RedditPostArgs;

  if (!typedArgs.subreddit || !typedArgs.title || !typedArgs.kind) {
    throw new Error("Invalid Reddit post arguments: missing required fields");
  }

  return typedArgs;
};

// Type assertion helper for Reddit reply arguments
export const assertRedditReplyArgs = (args: unknown): RedditReplyArgs => {
  const typedArgs = args as RedditReplyArgs;

  if (!typedArgs.postId || !typedArgs.content) {
    throw new Error("Invalid Reddit reply arguments: missing required fields");
  }

  return typedArgs;
};
