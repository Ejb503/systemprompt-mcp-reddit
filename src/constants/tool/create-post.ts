import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createRedditPost: Tool = {
  name: "create_reddit_post",
  description: "Creates a new text post for Reddit. This will not post to Reddit.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit where the post will be submitted",
      },
      content: {
        type: "string",
        description: "Instructions for generating the post content using LLM",
      },
    },
    required: ["subreddit", "content"],
  },
  _meta: {
    hidden: false,
  },
};
