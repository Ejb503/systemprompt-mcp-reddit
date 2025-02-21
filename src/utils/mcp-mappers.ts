import {
  GetPromptResult,
  ListResourcesResult,
  ListPromptsResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  SystempromptPromptResponse,
  SystempromptBlockResponse,
  SystempromptAgentResponse,
} from "../types/systemprompt.js";

/**
 * Maps input schema properties to MCP argument format.
 * Shared between single prompt and list prompt mappings.
 */
function mapPromptArguments(prompt: SystempromptPromptResponse) {
  return Object.entries(prompt.input.schema.properties || {})
    .map(([name, schema]) => {
      if (typeof schema === "boolean") return null;
      if (typeof schema !== "object" || schema === null) return null;
      return {
        name,
        description: "description" in schema ? String(schema.description || "") : "",
        required: prompt.input.schema.required?.includes(name) || false,
      };
    })
    .filter((arg): arg is NonNullable<typeof arg> => arg !== null);
}

/**
 * Maps a single prompt to the MCP GetPromptResult format.
 * Used when retrieving a single prompt's details.
 */
export function mapPromptToGetPromptResult(prompt: SystempromptPromptResponse): GetPromptResult {
  return {
    name: prompt.metadata.title,
    description: prompt.metadata.description || undefined,
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: prompt.instruction.static,
        },
      },
    ],
    arguments: mapPromptArguments(prompt),
    tools: [],
    _meta: { prompt },
  };
}

/**
 * Maps an array of prompts to the MCP ListPromptsResult format.
 * Used when listing multiple prompts.
 */
export function mapPromptsToListPromptsResult(
  prompts: SystempromptPromptResponse[],
): ListPromptsResult {
  return {
    _meta: { prompts },
    prompts: prompts.map((prompt) => ({
      name: prompt.metadata.title,
      description: prompt.metadata.description || undefined,
      arguments: mapPromptArguments(prompt),
    })),
  };
}

/**
 * Maps a single block to the MCP ReadResourceResult format.
 * Used when retrieving a single block's details.
 */
export function mapBlockToReadResourceResult(block: SystempromptBlockResponse): ReadResourceResult {
  return {
    contents: [
      {
        uri: `resource:///block/${block.id}`,
        mimeType: "text/plain",
        text: JSON.stringify(block.content),
      },
    ],
    _meta: {},
  };
}

export function mapAgentToReadResourceResult(agent: SystempromptAgentResponse): ReadResourceResult {
  return {
    contents: [
      {
        uri: `resource:///agent/${agent.id}`,
        mimeType: "text/plain",
        text: agent.content,
      },
    ],
    _meta: {
      agent: true,
    },
  };
}

/**
 * Maps an array of blocks to the MCP ListResourcesResult format.
 * Used when listing multiple blocks.
 */
export function mapBlocksToListResourcesResult(
  blocks: SystempromptBlockResponse[],
): ListResourcesResult {
  return {
    _meta: {},
    resources: blocks.map((block) => ({
      uri: `resource:///block/${block.id}`,
      name: block.metadata.title,
      description: block.metadata.description || undefined,
      mimeType: "text/plain",
    })),
  };
}

export function mapAgentsToListResourcesResult(
  agents: SystempromptAgentResponse[],
): ListResourcesResult {
  return {
    _meta: {},
    resources: agents.map((agent) => ({
      uri: `resource:///agent/${agent.id}`,
      name: agent.metadata.title,
      description: agent.metadata.description || undefined,
      mimeType: "text/plain",
      _meta: {
        agent: true,
      },
    })),
  };
}
