import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createComment: Tool = {
  name: "create_comment",
  description:
    "Creates a comment on a Reddit post or another comment. This will not post to Reddit. It will create a draft that can be edited and sent manually below. The response should include properly formatted parent ID and comment content.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit where the comment will be submitted",
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the comment content. The generated comment should be in markdown format and must not exceed 10000 characters.",
      },
      id: {
        type: "string",
        description:
          "The ID of the parent post/comment to comment on. For the response, prefix with t1_ for comments or t3_ for posts.",
      },
    },
    required: ["subreddit", "content", "id"],
  },
  _meta: {
    hidden: true,
    displayTitle: "Create Comment",
    type: "api",
    callback: "create_comment_callback",
  },
};

export const createRedditCommentSuccessMessage =
  "The user has successfully created a comment on a Reddit post or comment. Present the comment to the user and congratulate them on their comment.";
