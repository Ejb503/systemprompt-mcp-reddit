import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { ConfigureInstructionsArgs, ToolHandler, formatToolResponse } from "./types.js";
import { configureInstructionsSuccessMessage } from "@/constants/tool/configure-instructions.js";
import { RedditError } from "@/types/reddit.js";
import { JSONSchema7 } from "json-schema";

const blockSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    content: { type: "string" },
    type: { type: "string" },
    prefix: { type: "string" },
    metadata: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        tag: { type: "array", items: { type: "string" } },
      },
      required: ["title", "description", "tag"],
    },
  },
  required: ["id", "content", "type", "prefix", "metadata"],
};

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        config: blockSchema,
      },
      required: ["config"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleConfigureInstructions: ToolHandler<ConfigureInstructionsArgs> = async (
  args,
  { systemPromptService, hasSystemPromptApiKey },
) => {
  try {
    if (!hasSystemPromptApiKey) {
      return formatToolResponse({
        status: "error",
        message:
          "SystemPrompt API key is required to configure instructions. Please provide X-SystemPrompt-API-Key header.",
        error: {
          type: "API_ERROR",
          details: "Missing SystemPrompt API key",
        },
        type: "api",
        title: "Configuration Error",
      });
    }
    const instructionBlock: SystempromptBlockRequest = {
      content: JSON.stringify(args),
      type: "block",
      prefix: "reddit_instructions",
      metadata: {
        title: "Reddit Instructions",
        description: "Content creation guidelines for Reddit",
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    const result = await systemPromptService.upsertBlock(instructionBlock);

    return formatToolResponse({
      message: configureInstructionsSuccessMessage,
      result: {
        config: result,
      },
      schema: responseSchema,
      type: "api",
      title: "Configure Instructions",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to save Reddit instructions: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "api",
      title: "Error Configuring Instructions",
    });
  }
};
