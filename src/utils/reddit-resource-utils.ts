import { SystempromptBlockResponse } from "@/types/systemprompt.js";

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
  CREATE_POST: "create_post",
  CREATE_REPLY: "create_reply",
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
export const getRedditSchemas = () => {
  const postSchema = {
    type: "object",
    properties: {
      subreddit: { type: "string", description: "Subreddit to post to (without r/)" },
      title: { type: "string", description: "Title of the post" },
      kind: { type: "string", enum: ["link", "self"], description: "Type of post (link or self)" },
      url: { type: "string", description: "URL for link posts" },
      content: { type: "string", description: "Content for self posts" },
    },
    required: ["subreddit", "title", "kind"],
    additionalProperties: false,
  };

  const replySchema = {
    type: "object",
    properties: {
      postId: { type: "string", description: "ID of the post to reply to" },
      content: { type: "string", description: "Content of the reply" },
    },
    required: ["postId", "content"],
    additionalProperties: false,
  };

  return {
    create_reddit_post: postSchema,
    create_reddit_reply: replySchema,
  };
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
  const baseActions = [ACTIONS.EDIT, ACTIONS.DELETE];

  // Map message type to appropriate action
  if (resourceType === RESOURCE_TYPES.POST || resourceType === RESOURCE_TYPES.MESSAGE) {
    return [...baseActions, ACTIONS.CREATE_POST];
  } else if (resourceType === RESOURCE_TYPES.REPLY) {
    return [...baseActions, ACTIONS.CREATE_REPLY];
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
