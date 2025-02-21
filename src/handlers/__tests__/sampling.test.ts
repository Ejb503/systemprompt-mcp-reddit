import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { sendSamplingRequest } from "../sampling";

// Mock server module
const mockCreateMessage = jest.fn<(params: CreateMessageRequest) => Promise<CreateMessageResult>>();
jest.mock("../../server", () => ({
  __esModule: true,
  server: {
    createMessage: mockCreateMessage,
    notification: jest.fn(),
  },
}));

// Mock all callback handlers
const mockCallbacks = {
  handleSendEmailCallback: jest.fn<() => Promise<string>>(),
};

jest.mock("../callbacks", () => mockCallbacks);

describe("sampling", () => {
  const mockResult: CreateMessageResult = {
    content: {
      type: "text",
      text: "Test response",
    },
    role: "assistant",
    model: "test-model",
    _meta: {},
  };

  const validRequest: CreateMessageRequest = {
    method: "sampling/createMessage",
    params: {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "test message",
          },
        },
      ],
      maxTokens: 100,
      temperature: 0.7,
      includeContext: "none",
      _meta: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMessage.mockResolvedValue(mockResult);
    mockCallbacks.handleSendEmailCallback.mockResolvedValue("Email sent successfully");
  });

  describe("sendSamplingRequest", () => {
    it("should process sampling request successfully", async () => {
      const result = await sendSamplingRequest(validRequest);
      expect(result).toEqual(mockResult);
      expect(mockCreateMessage).toHaveBeenCalledWith(validRequest);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Test error");
      mockCreateMessage.mockRejectedValueOnce(error);
      await expect(sendSamplingRequest(validRequest)).rejects.toThrow("Test error");
    });

    it("should validate request parameters", async () => {
      const invalidRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          messages: [],
        },
      };
      await expect(sendSamplingRequest(invalidRequest)).rejects.toThrow(
        "Invalid request parameters",
      );
    });
  });
});
