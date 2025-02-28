import { ToolHandler, SearchRedditArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { searchRedditSuccessMessage } from "@/constants/tool/search-reddit.js";
import { JSONSchema7 } from "json-schema";

const searchResultSchema: JSONSchema7 = {
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
        results: {
          type: "array",
          items: searchResultSchema,
        },
      },
      required: ["results"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleSearchReddit: ToolHandler<SearchRedditArgs> = async (
  args,
  { redditService },
) => {
  try {
    const { query, subreddit, sort = "relevance", time = "all", limit = 25 } = args;

    if (!query.trim()) {
      throw new RedditError("Search query cannot be empty", "VALIDATION_ERROR");
    }

    const searchResults = await redditService.searchReddit({
      query,
      subreddit,
      sort,
      time,
      limit,
    });

    return formatToolResponse({
      message: searchRedditSuccessMessage,
      result: {
        results: searchResults.map((post) => ({
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
      title: "Reddit Search Results",
    });
  } catch (error) {
    console.error("Failed to search Reddit:", error);
    return formatToolResponse({
      status: "error",
      message: `Failed to search Reddit: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Searching Reddit",
    });
  }
};
