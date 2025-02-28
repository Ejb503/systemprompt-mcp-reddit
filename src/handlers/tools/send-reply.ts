import { ToolHandler, SendReplyArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
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
            name: { type: "string" },
            permalink: { type: "string" },
          },
          required: ["id"],
        },
      },
      required: ["response"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleSendReply: ToolHandler<SendReplyArgs> = async (args, { redditService }) => {
  try {
    const { parentId, content } = args;

    if (!parentId || !content) {
      throw new RedditError(
        "parentId and content are required for sending replies",
        "VALIDATION_ERROR",
      );
    }

    const response = await redditService.sendReply(parentId, content);

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
    console.error("Failed to send reply:", error);
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
