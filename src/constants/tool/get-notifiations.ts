import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getRedditNotifications: Tool = {
  name: "get_reddit_notifications",
  description: "Fetches user notifications from Reddit (replies, mentions, messages)",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        enum: ["all", "unread", "messages", "comments", "mentions"],
        description: "Type of notifications to fetch",
        default: "all",
      },
      limit: {
        type: "number",
        description: "Maximum number of notifications to fetch",
        default: 25,
      },
      markRead: {
        type: "boolean",
        description: "Whether to mark fetched notifications as read",
        default: false,
      },
    },
    required: [],
  },
  _meta: {
    hidden: false,
  },
};
