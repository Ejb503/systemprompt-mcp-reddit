import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createReply: Tool = {
  name: "create_reply",
  description:
    "Creates a reply to a Reddit post or comment. This will not post to Reddit. It will create a draft that can be edited and sent manually below. The response should include properly formatted parent ID and reply text.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit where the reply will be submitted",
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the reply content. The generated reply should be in markdown format and must not exceed 10000 characters.",
      },
      parentId: {
        type: "string",
        description:
          "The ID of the parent post/comment to reply to. For the response, prefix with t1_ for comments or t3_ for posts.",
      },
      parentType: {
        type: "string",
        enum: ["comment", "post"],
        description: "The type of content being replied to (comment or post)",
      },
    },
    required: ["subreddit", "content", "parentId", "parentType"],
  },
  _meta: {
    hidden: true,
    displayTitle: "Create Reply",
    type: "api",
    callback: "create_reply_callback",
  },
};

export const createRedditReplySuccessMessage =
  "The user has successfully created a reply to a Reddit post or comment. Present the reply to the user and congratulate them on their reply.";
