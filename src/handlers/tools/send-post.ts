import { ToolHandler, SendRedditPostArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendRedditPostSuccessMessage } from "@/constants/tool/send-post.js";
import { JSONSchema7 } from "json-schema";

const postResponseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    url: { type: "string" },
    permalink: { type: "string" },
  },
  required: ["id"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        post: postResponseSchema,
      },
      required: ["post"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleSendRedditPost: ToolHandler<SendRedditPostArgs> = async (
  args,
  { redditService },
) => {
  if (!args.messageId) {
    throw new RedditError("messageId is required for sending posts", "VALIDATION_ERROR");
  }

  try {
    const { subreddit, title, content, kind = "text", url } = args;

    if (!subreddit || !title) {
      throw new RedditError(
        "subreddit and title are required for sending posts",
        "VALIDATION_ERROR",
      );
    }

    const post = await redditService.createPost({
      subreddit,
      title,
      content,
      kind,
      url,
    });

    return formatToolResponse({
      message: sendRedditPostSuccessMessage,
      result: {
        post,
      },
      schema: responseSchema,
      type: "server",
      title: "Send Reddit Post",
    });
  } catch (error) {
    console.error("Failed to send Reddit post:", error);
    return formatToolResponse({
      status: "error",
      message: `Failed to send Reddit post: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Sending Post",
    });
  }
};
