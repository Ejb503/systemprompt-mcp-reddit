import { ToolHandler, GetRedditNotificationsArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { getRedditNotificationsSuccessMessage } from "@/constants/tool/get-notifications.js";
import { JSONSchema7 } from "json-schema";

const notificationSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    author: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
    context: { type: "string" },
    isNew: { type: "boolean" },
    createdUtc: { type: "number" },
    formattedTime: { type: "string", format: "date-time" },
  },
  required: ["id", "type", "author", "body", "isNew", "createdUtc", "formattedTime"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        notifications: {
          type: "array",
          items: notificationSchema,
        },
      },
      required: ["notifications"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleGetRedditNotifications: ToolHandler<GetRedditNotificationsArgs> = async (
  args,
  { redditService },
) => {
  try {
    // Fetch notifications with the provided options
    const notifications = await redditService.fetchNotifications({
      filter: args.filter || "all",
      limit: args.limit || 25,
      markRead: args.markRead || false,
      excludeIds: args.excludeIds,
      excludeTypes: args.excludeTypes,
      excludeSubreddits: args.excludeSubreddits,
      after: args.after,
      before: args.before,
    });

    // Format the notifications for better readability
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      formattedTime: new Date(notification.createdUtc * 1000).toISOString(),
      // Truncate very long bodies
      body:
        notification.body.length > 500
          ? `${notification.body.substring(0, 500)}... (truncated)`
          : notification.body,
    }));

    return formatToolResponse({
      message: getRedditNotificationsSuccessMessage,
      result: {
        notifications: formattedNotifications,
      },
      schema: responseSchema,
      type: "server",
      title: "Reddit Notifications",
    });
  } catch (error) {
    console.error("Failed to fetch Reddit notifications:", error);
    return formatToolResponse({
      status: "error",
      message: `Failed to fetch Reddit notifications: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Fetching Notifications",
    });
  }
};
