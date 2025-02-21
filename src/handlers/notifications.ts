import { ServerNotification } from "@modelcontextprotocol/sdk/types.js";
import { server } from "../server.js";

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

async function sendNotification(notification: ServerNotification) {
  await server.notification(notification);
}

export async function updateBlocks() {
  await server.sendResourceListChanged();
}
