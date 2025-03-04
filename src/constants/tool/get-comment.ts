import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getComment: Tool = {
  name: "get_comment",
  description: "Fetches a Reddit comment and optionally its full thread of replies",
  inputSchema: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        description: "The ID of the comment to fetch",
      },
      includeThread: {
        type: "boolean",
        description: "Whether to fetch the entire comment thread with replies",
        default: false,
      },
    },
  },
  _meta: {
    hidden: true,
    title: "Get Comment",
    type: "server",
  },
};

export const getCommentSuccessMessage =
  "The user has successfully fetched a Reddit comment. Summarize the content concisely.";
