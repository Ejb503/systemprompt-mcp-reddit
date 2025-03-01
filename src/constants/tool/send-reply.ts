import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendReply: Tool = {
  name: "send_reply",
  description: "Sends a reply to a Reddit post or comment",
  inputSchema: {
    type: "object",
    required: ["parentId", "text"],
    properties: {
      parentId: {
        type: "string",
        description:
          "The ID of the parent post or comment to reply to (must start with t1_ for comments or t3_ for posts)",
        pattern: "^t[1|3]_[a-z0-9]+$",
      },
      text: {
        type: "string",
        description: "The markdown text of the reply (max 10000 characters)",
        maxLength: 10000,
      },
      sendreplies: {
        type: "boolean",
        description: "Whether to send reply notifications",
        default: true,
      },
    },
  },
  _meta: {
    hidden: true,
    displayTitle: "Send Reply",
    type: "server",
  },
};

export const sendReplySuccessMessage =
  "Successfully sent the reply. The reply has been posted and should be visible in the thread. Would you like to view the updated thread or send another reply?";
