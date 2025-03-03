import { ToolHandler, SendPostArgs, formatToolResponse } from "./types.js";
import { RedditError, RedditPostParams } from "@/types/reddit.js";
import { sendRedditPostSuccessMessage } from "@/constants/tool/send-post.js";
import { JSONSchema7 } from "json-schema";

const postResponseSchema: JSONSchema7 = {
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
            url: { type: "string" },
            title: { type: "string" },
            subreddit: { type: "string" },
            permalink: { type: "string" },
          },
          required: ["id", "url", "title", "subreddit", "permalink"],
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
        post: postResponseSchema,
      },
      required: ["post"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleSendPost: ToolHandler<SendPostArgs> = async (args, { redditService }) => {
  if (!args.id) {
    throw new RedditError("id is required for sending posts", "VALIDATION_ERROR");
  }

  try {
    const { subreddit, title, content, kind = "self", url } = args;

    if (!subreddit || !title) {
      throw new RedditError("Missing required fields", "VALIDATION_ERROR");
    }

    const postKind: RedditPostParams["kind"] = kind || (url ? "link" : "self");
    const postParams: RedditPostParams = {
      subreddit,
      title,
      kind: postKind,
      content,
      url,
    };

    const post = await redditService.createPost(postParams);

    return formatToolResponse({
      status: "success",
      message: sendRedditPostSuccessMessage,
      result: { post },
      schema: responseSchema,
      type: "server",
      title: "Send Reddit Post",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to send post: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Sending Post",
    });
  }
};
