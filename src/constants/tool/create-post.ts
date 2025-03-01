import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createPost: Tool = {
  name: "create_post",
  description:
    "Creates a new text post for Reddit. This will not post to Reddit, it will create a draft that can be edited and sent manually below.",
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
    displayTitle: "Create Post",
    type: "api",
    callback: "create_post_callback",
  },
};

export const createRedditPostSuccessMessage =
  "The user has successfully created a new post for Reddit. Present the post to the user and congratulate them on their new post.";
