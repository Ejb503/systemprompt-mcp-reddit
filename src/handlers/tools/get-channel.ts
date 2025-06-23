import { getChannelSuccessMessage } from '@reddit/constants/tool/get-channel';
import { RedditError } from '@reddit/types/reddit';
import type { JSONSchema7 } from "json-schema";

import { formatToolResponse } from './types';
import type { ToolHandler, GetChannelArgs} from './types';

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
    formattedTime: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "author", "subreddit", "url", "score", "numComments", "createdUtc", "permalink", "formattedTime"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      items: postSchema,
    },
    subreddit: { type: "string" },
    sort: { type: "string" },
  },
  required: ["posts", "subreddit", "sort"],
};

export const handleGetChannel: ToolHandler<GetChannelArgs> = async (args, { redditService }) => {
  try {
    const { sort = "hot", subreddit } = args;

    if (!subreddit) {
      throw new RedditError("Subreddit is required", "VALIDATION_ERROR");
    }

    const posts = await redditService.fetchPosts({
      sort,
      subreddit,
      limit: 25
    });

    return formatToolResponse({
      message: getChannelSuccessMessage,
      result: {
        posts,
        subreddit,
        sort,
      },
      schema: responseSchema,
      type: "server",
      title: "Channel Posts Retrieved",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to fetch channel posts: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Fetching Channel Posts",
    });
  }
};