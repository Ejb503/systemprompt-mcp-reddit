import { ToolHandler, SendReplyArgs, formatToolResponse } from "./types.js";
import { RedditError, RedditReplyParams } from "@/types/reddit.js";
import { sendReplySuccessMessage } from "@/constants/tool/send-reply.js";
import { JSONSchema7 } from "json-schema";

const replyResponseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        response: {
          type: "object",
          properties: {
            id: { type: "string" },
            parent_id: { type: "string" },
            body: { type: "string" },
            permalink: { type: "string" },
          },
          required: ["id", "parent_id", "body", "permalink"],
        },
      },
      required: ["response"],
    },
  },
  required: ["status", "message", "result"],
};

const replyInputSchema: JSONSchema7 = {
  type: "object",
  properties: {
    parentId: {
      type: "string",
      description:
        "The ID of the parent post or comment to reply to (must start with t1_ for comments or t3_ for posts)",
      pattern: "^t[1|3]_[a-z0-9]+$",
    },
    text: {
      type: "string",
      description: "The markdown text of the reply (max 10000 characters)",
      maxLength: 10000,
    },
    sendreplies: {
      type: "boolean",
      description: "Whether to send reply notifications",
      default: true,
    },
  },
  required: ["parentId", "text"],
};

export const handleSendReply: ToolHandler<SendReplyArgs> = async (args, { redditService }) => {
  try {
    const { parentId, text } = args;

    if (!parentId || !text) {
      throw new RedditError(
        "parentId and text are required for sending replies",
        "VALIDATION_ERROR",
      );
    }

    const params: RedditReplyParams = {
      parentId,
      text,
      sendreplies: true,
    };

    const response = await redditService.sendReply(params);

    return formatToolResponse({
      message: sendReplySuccessMessage,
      result: {
        response,
      },
      schema: replyResponseSchema,
      type: "server",
      title: "Send Reddit Reply",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to send reply: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Sending Reply",
    });
  }
};
