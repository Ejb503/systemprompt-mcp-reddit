import { Implementation, ServerCapabilities } from "@modelcontextprotocol/sdk/types.js";

export const serverConfig: Implementation = {
  name: "systemprompt-mcp-reddit",
  version: "1.0.15",
  metadata: {
    name: "System Prompt MCP Reddit",
    description:
      "A specialized Model Context Protocol (MCP) server that enables you to search, read, and interact with Reddit content, leveraging an AI Agent to help with each operation.",
    icon: "mdi:reddit",
    color: "orange",
    serverStartTime: Date.now(),
    environment: process.env.NODE_ENV,
    customData: {
      serverFeatures: ["agent", "prompts", "systemprompt"],
    },
  },
};

export const serverCapabilities: { capabilities: ServerCapabilities } = {
  capabilities: {
    resources: {
      listChanged: true,
    },
    tools: {
      listChanged: true,
    },
    prompts: {
      listChanged: true,
    },
    sampling: {},
    logging: {},
    _meta: {
      required: ["configure_instructions"],
    },
  },
};
