import { ToolHandler, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendRedditMessageSuccessMessage } from "@/constants/tool/send-message.js";
import { JSONSchema7 } from "json-schema";

const messageResponseSchema: JSONSchema7 = {
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
            recipient: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["id", "recipient", "subject", "body"],
        },
      },
      required: ["response"],
    },
  },
  required: ["status", "message", "result"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        message: messageResponseSchema,
      },
      required: ["message"],
    },
  },
  required: ["status", "message", "result"],
};

export interface SendMessageArgs {
  /** Username of the recipient */
  recipient: string;
  /** Subject line of the message (1-100 chars) */
  subject: string;
  /** Message content in markdown format (max 10000 chars) */
  content: string;
}

export const handleSendMessage: ToolHandler<SendMessageArgs> = async (args, { redditService }) => {
  try {
    const { recipient, subject, content } = args;

    if (!recipient || !subject || !content) {
      throw new RedditError("Missing required fields", "VALIDATION_ERROR");
    }

    const message = await redditService.sendMessage({
      recipient,
      subject,
      content,
    });

    return formatToolResponse({
      status: "success",
      message: sendRedditMessageSuccessMessage,
      result: { message },
      schema: responseSchema,
      type: "server",
      title: "Send Reddit Message",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Sending Message",
    });
  }
};
