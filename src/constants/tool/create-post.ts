import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createPost: Tool = {
  name: "create_post",
  description:
    "Creates a draft of a new text post for Reddit. This tool should be used when you want to start a new discussion, share information, or ask questions in a subreddit. It creates a draft that can be reviewed and edited before posting. The post should follow the target subreddit's rules and conventions, including proper formatting, flair usage if required, and appropriate content warnings (NSFW/spoiler tags). Consider the subreddit's culture and typical post structure when creating content. This tool is ideal for text-based submissions - use other tools for image, link, or video posts.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description:
          "The target subreddit where the post will be submitted (without the 'r/' prefix). Ensure the subreddit exists and allows text posts.",
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the post. Should specify: 1) An engaging, clear title (1-300 chars) that follows subreddit rules, 2) Well-formatted body text with proper markdown, paragraphs, and any required sections, 3) Whether to include flair (if available), NSFW tag, or spoiler tag based on content and subreddit rules.",
      },
    },
    required: ["subreddit", "content"],
  },
  _meta: {
    hidden: false,
    title: "Create Post",
    type: "api",
    callback: "create_post_callback",
  },
};

export const createRedditPostSuccessMessage =
  "The user has successfully created a new post for Reddit. Present the post to the user and congratulate them on their new post.";
