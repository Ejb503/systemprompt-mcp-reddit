import { ServerNotification } from "@modelcontextprotocol/sdk/types.js";
import { server } from "../server.js";

type SamplingCompleteNotification = {
  method: "notifications/sampling/complete";
  params: {
    _meta: Record<string, unknown>;
    message: string;
    level: "info" | "warning" | "error";
    timestamp: string;
  };
};

type RedditConfigNotification = {
  method: "server/config/changed";
  params: {
    _meta: Record<string, unknown>;
    message: string;
    level: "info" | "warning" | "error";
    timestamp: string;
  };
};

export async function sendOperationNotification(operation: string, message: string): Promise<void> {
  const notification: ServerNotification = {
    method: "notifications/message",
    params: {
      _meta: {},
      message: `Operation ${operation}: ${message}`,
      level: "info",
      timestamp: new Date().toISOString(),
    },
  };
  await sendNotification(notification);
}

export async function sendJsonResultNotification(message: string): Promise<void> {
  const notification: ServerNotification = {
    method: "notifications/message",
    params: {
      _meta: {},
      message: message,
      level: "info",
      timestamp: new Date().toISOString(),
    },
  };
  await sendNotification(notification);
}

export async function sendSamplingCompleteNotification(message: string): Promise<void> {
  const notification: SamplingCompleteNotification = {
    method: "notifications/sampling/complete",
    params: {
      _meta: {},
      message: message,
      level: "info",
      timestamp: new Date().toISOString(),
    },
  };
  await sendNotification(notification);
}

export async function sendRedditConfigNotification(message: string): Promise<void> {
  const notification: RedditConfigNotification = {
    method: "server/config/changed",
    params: {
      _meta: {},
      message: message,
      level: "info",
      timestamp: new Date().toISOString(),
    },
  };
  await sendNotification(notification);
}

async function sendNotification(
  notification: ServerNotification | SamplingCompleteNotification | RedditConfigNotification,
) {
  await server.notification(notification as ServerNotification);
}

export async function updateBlocks() {
  await server.sendResourceListChanged();
}
