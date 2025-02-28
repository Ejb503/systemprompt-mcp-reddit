import { ToolHandler, GetChannelPostsArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { getPostsSuccessMessage } from "@/constants/tool/get-posts.js";
import { JSONSchema7 } from "json-schema";

const postSchema: JSONSchema7 = {
  type: "object",
  properties: {
    title: { type: "string" },
    subreddit: { type: "string" },
    url: { type: "string" },
    score: { type: "number" },
    numComments: { type: "number" },
    createdUtc: { type: "number" },
    summary: { type: ["string", "null"] },
    id: { type: "string" },
  },
  required: ["title", "subreddit", "score", "numComments", "createdUtc", "id"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: postSchema,
        },
      },
      required: ["posts"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleGetChannelPosts: ToolHandler<GetChannelPostsArgs> = async (
  args,
  { redditService },
) => {
  try {
    const posts = await redditService.fetchPosts({
      sort: args.sort,
      subreddits: [args.subreddit],
    });

    return formatToolResponse({
      message: getPostsSuccessMessage,
      result: {
        posts: posts.map((post) => ({
          title: post.title,
          subreddit: post.subreddit,
          url: post.url,
          score: post.score,
          numComments: post.numComments,
          createdUtc: post.createdUtc,
          summary: post.selftext?.substring(0, 200),
          id: post.id,
        })),
      },
      schema: responseSchema,
      type: "server",
      title: "Reddit Posts",
    });
  } catch (error) {
    console.error("Failed to fetch Reddit content:", error);
    return formatToolResponse({
      status: "error",
      message: `Failed to fetch Reddit content: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Fetching Posts",
    });
  }
};
