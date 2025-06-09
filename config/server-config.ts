import { Implementation, ServerCapabilities } from "@modelcontextprotocol/sdk/types.js";

export const serverConfig: Implementation = {
  name: "systemprompt-mcp-gmail",
  version: "1.0.0",
  metadata: {
    name: "System Prompt Gmail Integration Server",
    description:
      "A specialized Model Context Protocol (MCP) server that enables you to search, read, delete and send emails from your Gmail account, leveraging an AI Agent to help with each operation. The server is designed to work with the [multimodal-mcp-client](https://github.com/Ejb503/multimodal-mcp-client), a voice-powered MCP client that provides the frontend interface.",
    icon: "solar:align-horizontal-center-line-duotone",
    color: "primary",
    serverStartTime: Date.now(),
    environment: "production",
    customData: {
      serverFeatures: ["gmail", "agent", "google", "systemprompt"],
    },
  },
};

export const serverCapabilities: { capabilities: ServerCapabilities } = {
  capabilities: {
    resources: {
      listChanged: true,
    },
    tools: {},
    prompts: {
      listChanged: true,
    },
    sampling: {},
    logging: {},
  },
};
