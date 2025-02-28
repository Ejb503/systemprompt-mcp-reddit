import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendReply: Tool = {
  name: "send_reply",
  description: "Sends a reply to a Reddit post or comment",
  inputSchema: {
    type: "object",
    required: ["parentId", "content"],
    properties: {
      parentId: {
        type: "string",
        description: "The ID of the parent post or comment to reply to",
      },
      content: {
        type: "string",
        description: "The content of the reply",
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
