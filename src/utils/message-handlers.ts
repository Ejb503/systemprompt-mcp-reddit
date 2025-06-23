/**
 * @file Message handling utilities for MCP prompts
 * @module utils/message-handlers
 * 
 * @remarks
 * This module provides utilities for manipulating MCP prompt messages,
 * including content injection and variable substitution. It supports
 * template syntax with conditional blocks and variable placeholders.
 * 
 * The template syntax supports:
 * - Variable substitution: {{variableName}}
 * - Conditional blocks: {{#condition}}content{{/condition}}
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/prompts} MCP Prompts Specification
 */

import type { PromptMessage } from '@modelcontextprotocol/sdk/types.js';

import { XML_TAGS } from '../constants/message-handler';

/**
 * Type for block content that can be serialized to JSON
 * @remarks
 * Represents any JSON-serializable content that can be injected into messages
 */
type BlockContent = Record<string, unknown> | unknown[] | string | number | boolean | null;

/**
 * Updates a user message with existing page content
 * 
 * @param messages - Array of messages to update (modified in place)
 * @param blocks - The page blocks to include as JSON content
 * 
 * @remarks
 * This function finds the first user message and injects existing content
 * using XML tags defined in the message handler constants. The content is
 * serialized as formatted JSON and inserted before the closing request params tag.
 * 
 * @example
 * ```typescript
 * const messages = [{
 *   role: 'user',
 *   content: { type: 'text', text: 'Some text </request_params>' }
 * }];
 * 
 * updateUserMessageWithContent(messages, { title: 'My Page' });
 * // Message now contains the page content in XML tags
 * ```
 */
export function updateUserMessageWithContent(messages: PromptMessage[], blocks: BlockContent): void {
  const userMessageIndex = messages.findIndex((msg) => msg.role === "user");
  if (userMessageIndex === -1) {return;}

  const userMessage = messages[userMessageIndex];
  if (userMessage.content.type !== "text") {return;}

  messages[userMessageIndex] = {
    role: "user",
    content: {
      type: "text",
      text: userMessage.content.text.replace(
        XML_TAGS.REQUEST_PARAMS_CLOSE,
        XML_TAGS.EXISTING_CONTENT_TEMPLATE(JSON.stringify(blocks, null, 2)),
      ),
    },
  };
}

/**
 * Injects variables into text using template syntax
 * 
 * @param text - The text containing variable placeholders
 * @param variables - Object containing variable values
 * @returns The text with variables replaced
 * @throws {Error} Thrown if required variables are missing
 * 
 * @remarks
 * This function supports two types of template syntax:
 * 1. Variable substitution: {{variableName}} - replaced with variable value
 * 2. Conditional blocks: {{#condition}}content{{/condition}} - included only if condition is truthy
 * 
 * Variables are converted to strings using String() constructor.
 * Missing variables cause an error listing all missing keys.
 * 
 * @example
 * ```typescript
 * const text = 'Hello {{name}}! {{#premium}}You are a premium user.{{/premium}}';
 * const vars = { name: 'Alice', premium: true };
 * 
 * const result = injectVariablesIntoText(text, vars);
 * // "Hello Alice! You are a premium user."
 * 
 * const vars2 = { name: 'Bob', premium: false };
 * const result2 = injectVariablesIntoText(text, vars2);
 * // "Hello Bob! "
 * ```
 */
export function injectVariablesIntoText(text: string, variables: Record<string, unknown>): string {
  // First handle conditional blocks
  text = text.replace(/{{#([^}]+)}}(.*?){{\/\1}}/gs, (_, key, content) => {
    return key in variables && variables[key] ? content : "";
  });

  // Then handle direct variable replacements
  const directMatches = text.match(/{{([^#/][^}]*)}}/g);
  if (!directMatches) {return text;}

  const missingVariables = directMatches
    .map((match) => match.slice(2, -2))
    .filter((key) => !(key in variables));

  if (missingVariables.length > 0) {
    throw new Error(`Missing required variables: ${ missingVariables.join(", ")}`);
  }

  return text.replace(/{{([^#/][^}]*)}}/g, (_, key) => String(variables[key] ?? ""));
}

/**
 * Injects variables into a prompt message
 * 
 * @param message - The prompt message to process
 * @param variables - Object containing variable values
 * @returns New message with variables injected
 * 
 * @remarks
 * This function only processes text messages. Non-text messages are
 * returned unchanged. It uses {@link injectVariablesIntoText} to
 * perform the actual variable substitution.
 * 
 * @example
 * ```typescript
 * const message: PromptMessage = {
 *   role: 'assistant',
 *   content: { type: 'text', text: 'Processing {{count}} items...' }
 * };
 * 
 * const result = injectVariables(message, { count: 42 });
 * // result.content.text === "Processing 42 items..."
 * ```
 */
export function injectVariables(
  message: PromptMessage,
  variables: Record<string, unknown>,
): PromptMessage {
  if (message.content.type !== "text") {return message;}

  return {
    ...message,
    content: {
      type: "text",
      text: injectVariablesIntoText(message.content.text, variables),
    },
  };
}
