import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { sendOperationNotification } from "../notifications.js";
import * as serverModule from "../../server.js";

jest.mock("../../server.js", () => ({
  server: {
    notification: jest.fn().mockImplementation(() => Promise.resolve()),
  },
}));

describe("Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendOperationNotification", () => {
    it("should send a notification with operation details", async () => {
      await sendOperationNotification("test", "Test message");

      expect(serverModule.server.notification).toHaveBeenCalledWith({
        method: "notifications/message",
        params: {
          _meta: {},
          message: "Operation test: Test message",
          level: "info",
          timestamp: expect.any(String),
        },
      });
    });
  });
});
