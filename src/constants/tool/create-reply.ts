import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createRedditReply: Tool = {
  name: "create_reply",
  description:
    "Creates a reply to a Reddit post or comment. This will not post to Reddit. it will create a draft that can be edited and sent manually below",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit where the reply will be submitted",
      },
      content: {
        type: "string",
        description: "Instructions for generating the reply content using LLM",
      },
      messageId: {
        type: "string",
        description: "The ID of the post/comment to reply to",
      },
    },
    required: ["subreddit", "content", "messageId"],
  },
  _meta: {
    hidden: true,
    displayTitle: "Create Reply",
    type: "api",
    callback: "create_reddit_reply",
  },
};

export const createRedditReplySuccessMessage =
  "The user has successfully created a reply to a Reddit post or comment. Present the reply to the user and congratulate them on their reply.";
