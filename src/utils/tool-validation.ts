/**
 * @file Tool validation utilities for MCP server
 * @module utils/tool-validation
 * 
 * @remarks
 * This module provides validation for MCP tool calls, ensuring that:
 * - Tool names are valid and registered
 * - Tool arguments match their defined schemas
 * - Proper error messages are returned for invalid requests
 * 
 * Tool validation is a critical security and reliability feature that
 * prevents malformed or malicious tool calls from being executed.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools} MCP Tools Specification
 */

import type { CallToolRequest, Tool } from '@modelcontextprotocol/sdk/types.js';
import type { JSONSchema7 } from "json-schema";

import { TOOLS } from '../constants/tools';

import { validateWithErrors } from './validation';

/**
 * Validates a tool request and returns the tool configuration if valid
 * 
 * @param request - The tool call request from an MCP client
 * @returns The validated tool configuration
 * @throws {Error} Thrown if:
 *   - Tool name is missing
 *   - Tool is not registered
 *   - Tool arguments fail schema validation
 * 
 * @remarks
 * This function performs comprehensive validation:
 * 1. Checks that the tool name is provided
 * 2. Verifies the tool exists in the registry
 * 3. Validates arguments against the tool's JSON schema
 * 
 * @example
 * ```typescript
 * const request: CallToolRequest = {
 *   params: {
 *     name: 'reddit_search',
 *     arguments: { query: 'typescript', limit: 10 }
 *   }
 * };
 * 
 * try {
 *   const tool = validateToolRequest(request);
 *   console.log(`Validated tool: ${tool.name}`);
 * } catch (error) {
 *   console.error(`Invalid request: ${error.message}`);
 * }
 * ```
 */
export function validateToolRequest(request: CallToolRequest): Tool {
  if (!request.params?.name) {
    throw new Error("Invalid tool request: missing tool name");
  }

  const tool = TOOLS.find((t: Tool) => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  // Validate arguments against the tool's schema if present
  if (tool.inputSchema && request.params.arguments) {
    validateWithErrors(
      request.params.arguments,
      tool.inputSchema as JSONSchema7
    );
  }

  return tool;
}

/**
 * Gets the JSON schema for a tool by name
 * 
 * @param toolName - The name of the tool to get schema for
 * @returns The tool's input schema, or undefined if tool not found
 * 
 * @remarks
 * This utility function is useful for:
 * - Pre-validating tool arguments before submission
 * - Generating documentation or UI forms
 * - Understanding tool requirements programmatically
 * 
 * @example
 * ```typescript
 * const schema = getToolSchema('reddit_create_post');
 * if (schema) {
 *   console.log('Required fields:', schema.required);
 *   console.log('Properties:', Object.keys(schema.properties || {}));
 * }
 * ```
 */
export function getToolSchema(toolName: string): JSONSchema7 | undefined {
  const tool = TOOLS.find((t: Tool) => t.name === toolName);
  return tool?.inputSchema as JSONSchema7;
}
