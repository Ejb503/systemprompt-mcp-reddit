import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall } from "../tool-handlers.js";
import type {
  SystempromptPromptResponse,
  SystempromptUserStatusResponse,
  SystempromptBlockResponse,
  SystempromptAgentResponse,
} from "../../types/systemprompt.js";

// Mock the server config
jest.mock("../../config/server-config.js", () => ({
  serverConfig: {
    port: 3000,
    host: "localhost",
  },
  serverCapabilities: {
    tools: [],
  },
}));

// Mock the main function
jest.mock("../../index.ts", () => ({
  main: jest.fn(),
  server: {
    notification: jest.fn().mockImplementation(async () => {}),
  },
}));

// Mock the sampling module
jest.mock("../sampling.js", () => ({
  sendSamplingRequest: jest.fn().mockImplementation(async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({ metadata: { title: "Test", description: "Test" }, content: "Test" }),
      },
    ],
  })),
}));

// Mock SystemPromptService
const mockUserStatus: SystempromptUserStatusResponse = {
  user: {
    id: "user123",
    uuid: "uuid123",
    name: "Test User",
    email: "test@example.com",
    roles: ["user"],
    paddle_id: "paddle123",
  },
  content: {
    prompt: 0,
    artifact: 0,
    block: 0,
    conversation: 0,
  },
  usage: {
    ai: {
      execution: 0,
      token: 0,
    },
    api: {
      generation: 0,
    },
  },
  billing: {
    customer: {
      id: "cust123",
      name: null,
      email: "test@example.com",
      marketingConsent: false,
      status: "active",
      customData: null,
      locale: "en",
      createdAt: {
        date: "2024-01-01T00:00:00Z",
        timezone_type: 3,
        timezone: "UTC",
      },
      updatedAt: {
        date: "2024-01-01T00:00:00Z",
        timezone_type: 3,
        timezone: "UTC",
      },
      importMeta: null,
    },
    subscription: [
      {
        id: "sub123",
        status: "active",
        currency_code: "USD",
        billing_cycle: {
          frequency: 1,
          interval: "month",
        },
        current_billing_period: {
          starts_at: "2024-01-01",
          ends_at: "2024-02-01",
        },
        items: [
          {
            product: { name: "Test Product" },
            price: {
              unit_price: { amount: "10.00", currency_code: "USD" },
            },
          },
        ],
      },
    ],
  },
  api_key: "test-api-key",
};

interface MockSystemPromptService {
  fetchUserStatus: () => Promise<SystempromptUserStatusResponse>;
  getAllPrompts: () => Promise<SystempromptPromptResponse[]>;
  listBlocks: () => Promise<SystempromptBlockResponse[]>;
  listAgents: () => Promise<SystempromptAgentResponse[]>;
  deletePrompt: (id: string) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
}

const mockSystemPromptService = {
  fetchUserStatus: jest
    .fn<() => Promise<SystempromptUserStatusResponse>>()
    .mockResolvedValue(mockUserStatus),
  getAllPrompts: jest.fn<() => Promise<SystempromptPromptResponse[]>>().mockResolvedValue([]),
  listBlocks: jest.fn<() => Promise<SystempromptBlockResponse[]>>().mockResolvedValue([]),
  listAgents: jest.fn<() => Promise<SystempromptAgentResponse[]>>().mockResolvedValue([]),
  deletePrompt: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  deleteBlock: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
};

jest.mock("../../services/systemprompt-service.js", () => ({
  SystemPromptService: jest.fn(() => mockSystemPromptService),
}));

describe("Tool Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleToolCall", () => {
    describe("Heartbeat", () => {
      it("should handle systemprompt_heartbeat", async () => {
        const request: CallToolRequest = {
          method: "tools/call",
          params: {
            name: "systemprompt_heartbeat",
            params: {},
          },
        };

        const result = await handleToolCall(request);
        expect(mockSystemPromptService.fetchUserStatus).toHaveBeenCalled();
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toContain("User Information");
      });

      it("should handle errors gracefully", async () => {
        const error = new Error("Failed to fetch user status");
        mockSystemPromptService.fetchUserStatus.mockRejectedValueOnce(error);
        const request: CallToolRequest = {
          method: "tools/call",
          params: {
            name: "systemprompt_heartbeat",
            params: {},
          },
        };
        await expect(handleToolCall(request)).rejects.toThrow("Failed to fetch user status");
      });
    });

    describe("Resource Operations", () => {
      it("should handle systemprompt_fetch_resources", async () => {
        const result = await handleToolCall({
          method: "tools/call",
          params: {
            name: "systemprompt_fetch_resources",
            params: {},
          },
        });
        expect(mockSystemPromptService.getAllPrompts).toHaveBeenCalled();
        expect(mockSystemPromptService.listBlocks).toHaveBeenCalled();
        expect(mockSystemPromptService.listAgents).toHaveBeenCalled();
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toContain("Resources");
      });

      it("should handle delete resource failure", async () => {
        mockSystemPromptService.deletePrompt.mockRejectedValueOnce(
          new Error("Failed to delete prompt"),
        );
        mockSystemPromptService.deleteBlock.mockRejectedValueOnce(
          new Error("Failed to delete block"),
        );
        await expect(
          handleToolCall({
            method: "tools/call",
            params: {
              name: "systemprompt_delete_resource",
              arguments: {
                id: "nonexistent123",
              },
            },
          }),
        ).rejects.toThrow("Failed to delete resource with ID nonexistent123");
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid tool name", async () => {
        await expect(
          handleToolCall({
            method: "tools/call",
            params: {
              name: "invalid_tool",
              params: {},
            },
          }),
        ).rejects.toThrow("Unknown tool: invalid_tool");
      });

      it("should handle service errors", async () => {
        mockSystemPromptService.fetchUserStatus.mockRejectedValueOnce(new Error("Service error"));
        await expect(
          handleToolCall({
            method: "tools/call",
            params: {
              name: "systemprompt_heartbeat",
              params: {},
            },
          }),
        ).rejects.toThrow("Service error");
      });
    });
  });
});
