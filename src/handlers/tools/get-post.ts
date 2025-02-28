import { ToolHandler, GetPostArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { fetchPostSuccessMessage as getPostSuccessMessage } from "@/constants/tool/fetch-post.js";
import { JSONSchema7 } from "json-schema";

const commentSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    author: { type: "string" },
    body: { type: "string" },
    score: { type: "number" },
    createdUtc: { type: "number" },
    permalink: { type: "string" },
    depth: { type: "number" },
    formattedTime: { type: "string", format: "date-time" },
  },
  required: ["id", "author", "body", "score", "createdUtc", "permalink", "depth", "formattedTime"],
};

const commentThreadSchema: JSONSchema7 = {
  type: "object",
  properties: {
    comment: commentSchema,
    replies: {
      type: "array",
      items: { $ref: "#" }, // Recursive reference to the same schema
    },
  },
  required: ["comment", "replies"],
};

const postSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    author: { type: "string" },
    subreddit: { type: "string" },
    selftext: { type: ["string", "null"] },
    url: { type: "string" },
    score: { type: "number" },
    numComments: { type: "number" },
    createdUtc: { type: "number" },
    permalink: { type: "string" },
    comments: {
      type: "array",
      items: commentThreadSchema,
    },
  },
  required: [
    "id",
    "title",
    "author",
    "subreddit",
    "score",
    "numComments",
    "createdUtc",
    "permalink",
    "comments",
  ],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        post: postSchema,
      },
      required: ["post"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleGetPost: ToolHandler<GetPostArgs> = async (args, { redditService }) => {
  try {
    const { postId } = args;

    if (!postId) {
      throw new RedditError("postId is required for fetching posts", "VALIDATION_ERROR");
    }

    const postWithComments = await redditService.fetchPostById(postId);
    const formattedPost = {
      ...postWithComments,
      comments: formatCommentsForDisplay(postWithComments.comments),
    };

    return formatToolResponse({
      message: getPostSuccessMessage,
      result: {
        post: formattedPost,
      },
      schema: responseSchema,
      type: "server",
      title: "Reddit Post",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to fetch Reddit post: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Fetching Post",
    });
  }
};

/**
 * Formats comment threads for better display in the tool response
 * @param comments The comment threads to format
 * @param depth The current depth level (for indentation)
 * @returns Formatted comments
 */
function formatCommentsForDisplay(comments: any[], depth = 0): any[] {
  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return [];
  }

  return comments.map((thread) => {
    const { comment, replies } = thread;

    // Add depth and format the comment
    const formattedComment = {
      ...comment,
      depth,
      // Truncate very long comments for display
      body:
        comment.body.length > 1000
          ? `${comment.body.substring(0, 1000)}... (truncated)`
          : comment.body,
      formattedTime: new Date(comment.createdUtc * 1000).toISOString(),
    };

    // Format replies recursively with increased depth
    const formattedReplies = formatCommentsForDisplay(replies, depth + 1);

    return {
      comment: formattedComment,
      replies: formattedReplies,
    };
  });
}
