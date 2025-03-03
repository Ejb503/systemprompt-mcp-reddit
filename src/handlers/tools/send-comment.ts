import { ToolHandler, SendCommentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendCommentSuccessMessage } from "@/constants/tool/send-comment.js";
import { JSONSchema7 } from "json-schema";

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "The ID of the created comment",
    },
    content: {
      type: "string",
      description: "The content of the comment",
    },
    permalink: {
      type: "string",
      description: "The permalink to the comment",
    },
  },
  required: ["id", "content", "permalink"],
};

export const handleSendComment: ToolHandler<SendCommentArgs> = async (args, { redditService }) => {
  try {
    const { id, content, sendreplies = true } = args;

    if (!id) {
      throw new RedditError("id is required for sending comments", "VALIDATION_ERROR");
    }

    if (!content) {
      throw new RedditError("content is required for sending comments", "VALIDATION_ERROR");
    }

    // Validate ID format
    if (!/^t[1|3]_[a-z0-9]+$/.test(id)) {
      throw new RedditError(
        "Invalid ID format. Must start with t1_ for comments or t3_ for posts",
        "VALIDATION_ERROR",
      );
    }

    const params = {
      id,
      text: content,
      sendreplies,
    };

    const response = await redditService.sendComment(params);

    return formatToolResponse({
      message: sendCommentSuccessMessage,
      result: {
        id: response.id,
        content: response.text,
        permalink: response.permalink,
      },
      schema: responseSchema,
      type: "server",
      title: "Comment Sent",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to send comment: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Sending Comment",
    });
  }
};
