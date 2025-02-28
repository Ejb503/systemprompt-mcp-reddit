import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getRedditPosts: Tool = {
  name: "get_reddit_posts",
  description: "Fetches posts from configured subreddits using saved preferences",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "string",
        enum: ["hot", "new", "controversial"],
        description: "How to sort the posts",
      },
    },
    required: ["sort"],
  },
  _meta: {
    hidden: false,
  },
};
