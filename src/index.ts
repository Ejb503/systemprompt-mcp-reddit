#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { handleListResources, handleResourceCall } from "./handlers/resource-handlers.js";
import { handleListTools, handleToolCall } from "./handlers/tool-handlers.js";
import { handleListPrompts, handleGetPrompt } from "./handlers/prompt-handlers.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CallToolRequestSchema,
  CreateMessageRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";
import { SystemPromptService } from "./services/systemprompt-service.js";
import { sendSamplingRequest } from "./handlers/sampling.js";
import { server } from "./server.js";
import { RedditService } from "./services/reddit/reddit-service.js";
import { sendRedditConfigNotification } from "./handlers/notifications.js";

export async function main() {
  config();

  const apiKey = process.env.SYSTEMPROMPT_API_KEY;
  if (!apiKey) {
    throw new Error("SYSTEMPROMPT_API_KEY environment variable is required");
  }

  const redditClientId = process.env.REDDIT_CLIENT_ID;
  const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
  const redditRefreshToken = process.env.REDDIT_REFRESH_TOKEN;

  if (!redditClientId || !redditClientSecret || !redditRefreshToken) {
    throw new Error(
      "Reddit credentials not configured. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and REDDIT_REFRESH_TOKEN",
    );
  }

  SystemPromptService.initialize();

  server.setRequestHandler(ListResourcesRequestSchema, handleListResources);
  server.setRequestHandler(ReadResourceRequestSchema, handleResourceCall);
  server.setRequestHandler(ListToolsRequestSchema, handleListTools);
  server.setRequestHandler(CallToolRequestSchema, handleToolCall);
  server.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);
  server.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);
  server.setRequestHandler(CreateMessageRequestSchema, sendSamplingRequest);

  const transport = new StdioServerTransport();

  await server.connect(transport);
  const redditService = RedditService.getInstance();

  try {
    await redditService.initialize();
    const configData = await redditService.getRedditConfig();
    sendRedditConfigNotification(JSON.stringify(configData, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to connect to Reddit API: ${error instanceof Error ? error.message : error}`,
    );
  }
}

// Run the server unless in test environment
if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
