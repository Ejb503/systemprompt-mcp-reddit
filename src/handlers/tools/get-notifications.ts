import { ToolHandler, GetRedditNotificationsArgs } from "./types.js";

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

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              count: notifications.length,
              notifications: formattedNotifications,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error("Failed to fetch Reddit notifications:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to fetch Reddit notifications: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
};
