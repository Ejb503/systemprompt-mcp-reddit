import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createPost: Tool = {
  name: "create_post",
  description:
    "Creates a new post for Reddit. This will not post to Reddit, it will create a draft that can be edited and sent manually below. The response must include a title, content type (self/link), and appropriate content.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit where the post will be submitted",
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the post. The response should include: 1) A title (1-300 chars), 2) Post type (self/link), 3) Content (text or URL), 4) Optional flair, nsfw, and spoiler settings",
      },
      kind: {
        type: "string",
        enum: ["self", "link"],
        description: "Type of post to create - 'self' for text posts, 'link' for URL posts",
        default: "self",
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
