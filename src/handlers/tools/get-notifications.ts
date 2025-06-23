
import { getRedditNotificationsSuccessMessage } from '@reddit/constants/tool/get-notifications';
import { RedditError } from '@reddit/types/reddit';
import type { JSONSchema7 } from "json-schema";

import { formatToolResponse } from './types';
import type { ToolHandler, GetNotificationsArgs} from './types';

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

export const handleGetNotifications: ToolHandler<GetNotificationsArgs> = async (
  args,
  { redditService },
) => {
  try {
    const notifications = await redditService.fetchNotifications(args);

    return formatToolResponse({
      message: `Found ${notifications.length} notifications`,
      result: { notifications },
      schema: responseSchema,
      type: "server",
      title: "Get Notifications",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to fetch notifications: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "server",
      title: "Error Fetching Notifications",
    });
  }
};
