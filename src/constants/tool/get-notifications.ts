import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getNotifications: Tool = {
  name: "get_notifications",
  description: "Fetches notifications (inbox items) from Reddit",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        enum: ["all", "unread", "messages", "comments", "mentions"],
        description: "Filter notifications by type",
      },
      limit: {
        type: "number",
        description: "Maximum number of notifications to fetch",
      },
      markRead: {
        type: "boolean",
        description: "Whether to mark fetched notifications as read",
      },
      excludeIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs of notifications to exclude",
      },
      excludeTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["comment_reply", "post_reply", "username_mention", "message", "other"],
        },
        description: "Types of notifications to exclude",
      },
      excludeSubreddits: {
        type: "array",
        items: { type: "string" },
        description: "Subreddits to exclude notifications from",
      },
      after: {
        type: "string",
        description: "Fetch notifications after this ID",
      },
      before: {
        type: "string",
        description: "Fetch notifications before this ID",
      },
    },
  },
  _meta: {
    ignore: false,
    hidden: true,
    title: "Get Notifications",
    type: "server",
  },
};

export const getRedditNotificationsSuccessMessage =
  "The user has successfully fetched their notifications from Reddit. Read and understand the results, present a summary of the results to the user.";
