import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendComment: Tool = {
  name: "send_comment",
  description: "Sends a comment to a Reddit post or another comment",
  inputSchema: {
    type: "object",
    required: ["id", "text"],
    properties: {
      id: {
        type: "string",
        description:
          "The ID of the parent post or comment to comment on (must start with t1_ for comments or t3_ for posts)",
        pattern: "^t[1|3]_[a-z0-9]+$",
      },
      text: {
        type: "string",
        description: "The markdown text of the comment (max 10000 characters)",
        maxLength: 10000,
      },
      sendreplies: {
        type: "boolean",
        description: "Whether to send comment notifications",
        default: true,
      },
    },
  },
  _meta: {
    hidden: true,
    title: "Send Comment",
    type: "server",
  },
};

export const sendCommentSuccessMessage =
  "Successfully sent the comment. The comment has been posted and should be visible in the thread. Would you like to view the updated thread or send another comment?";
