/**
 * @file MCP Prompt request handlers
 * @module handlers/prompt-handlers
 * 
 * @remarks
 * This module implements handlers for MCP prompt operations. Prompts are
 * pre-defined templates that can be used with the sampling feature to
 * generate Reddit content with AI assistance.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/prompts | MCP Prompts}
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling}
 */

import { logger } from '@/utils/logger';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  ListPromptsRequest,
  ListPromptsResult,
  GetPromptRequest,
  GetPromptResult,
  PromptMessage,
} from '@modelcontextprotocol/sdk/types.js';
import { PROMPTS } from '@reddit/constants/sampling/index';

/**
 * Handles MCP prompt listing requests.
 * 
 * @remarks
 * Returns all available prompts that can be used for Reddit content generation.
 * These prompts are templates for creating posts, comments, and messages with
 * AI assistance through the sampling feature.
 * 
 * @param request - The prompt listing request
 * @param extra - Optional extra context (currently unused)
 * @returns Promise resolving to the list of available prompts
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/prompts#listing-prompts | Listing Prompts}
 */
export async function handleListPrompts(
  request: ListPromptsRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<ListPromptsResult> {
  return { prompts: PROMPTS };
}

/**
 * Handles MCP prompt retrieval requests.
 * 
 * @remarks
 * Retrieves a specific prompt by name and replaces template variables
 * with provided arguments. Template variables use the {{variable}} syntax
 * and are replaced with values from the request arguments.
 * 
 * For example, if a prompt contains "{{subreddit}}" and the request
 * includes {subreddit: "typescript"}, the text will be updated accordingly.
 * 
 * @param request - The prompt retrieval request with name and arguments
 * @param extra - Optional extra context (currently unused)
 * @returns Promise resolving to the prompt with variables replaced
 * @throws Error if the requested prompt is not found
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/prompts#getting-prompts | Getting Prompts}
 */
export async function handleGetPrompt(
  request: GetPromptRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<GetPromptResult> {
  const prompt = PROMPTS.find((p: any) => p.name === request.params.name);
  if (!prompt) {
    throw new Error(`Prompt not found: ${request.params.name}`);
  }

  // Replace variables in the prompt messages
  const messages = prompt.messages.map((message: PromptMessage) => {
    if (message.content.type !== 'text') {
      return message; // Return non-text content as-is
    }

    let text = String(message.content.text);

    // Replace variables with provided arguments
    if (request.params.arguments) {
      Object.entries(request.params.arguments).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        text = text.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }
    logger.info('Prompt messages sccuessfuly replaced');
    return {
      role: message.role,
      content: {
        type: 'text' as const,
        text: text,
      },
    };
  });

  return {
    description: prompt.description,
    messages: messages,
    _meta: prompt._meta,
  };
}
