import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createComment: Tool = {
  name: "create_comment",
  description:
    "Creates a draft comment to respond to an existing Reddit post or comment. This tool should be used when you want to contribute to an ongoing discussion, provide feedback, or engage with other users' content. The comment should be relevant to the parent content, maintain appropriate tone, and follow the subreddit's commenting guidelines. Comments can include markdown formatting for better readability (e.g., lists, quotes, code blocks). This tool creates a draft that can be reviewed and edited before posting - it doesn't post automatically. Use this for thoughtful responses that add value to the discussion.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description:
          "The subreddit where the comment will be posted (without the 'r/' prefix). Important for context and following subreddit-specific rules.",
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the comment content. Should create relevant, well-formatted text that contributes meaningfully to the discussion. Use markdown for formatting. Must not exceed 10000 characters. Consider the context and tone of the parent post/comment.",
      },
      id: {
        type: "string",
        description:
          "The unique ID of the parent post/comment being replied to. Must be prefixed with 't1_' for comments or 't3_' for posts. This determines where the comment will appear in the thread.",
      },
    },
    required: ["subreddit", "content", "id"],
  },
  _meta: {
    hidden: true,
    title: "Create Comment",
    type: "api",
    callback: "create_comment_callback",
  },
};

export const createRedditCommentSuccessMessage =
  "The user has successfully created a comment on a Reddit post or comment. Present the comment to the user and congratulate them on their comment.";
