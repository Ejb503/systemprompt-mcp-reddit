/**
 * @file SystemPrompt API service
 * @module services/systemprompt-service
 * 
 * @remarks
 * This service provides integration with the SystemPrompt API for tool management
 * in the Model Context Protocol (MCP) ecosystem. It handles authentication and
 * communication with the SystemPrompt platform.
 * 
 * SystemPrompt is a platform that allows developers to create and manage tools
 * that can be used by AI models through the MCP specification.
 * 
 * @see {@link https://systemprompt.io} SystemPrompt Platform
 * @see {@link https://modelcontextprotocol.io} Model Context Protocol
 */

import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration options for the SystemPrompt service
 */
export interface SystemPromptServiceConfig {
  /** API key for authenticating with SystemPrompt */
  apiKey: string;
  /** Optional custom base URL for the SystemPrompt API (defaults to https://api.systemprompt.io) */
  baseUrl?: string;
}

/**
 * Service for interacting with the SystemPrompt API
 * 
 * @remarks
 * This service provides methods for calling tools and listing available tools
 * through the SystemPrompt platform. It handles authentication via API key
 * and manages HTTP communication with the SystemPrompt API endpoints.
 * 
 * @example
 * ```typescript
 * const service = new SystemPromptService({
 *   apiKey: 'your-api-key'
 * });
 * 
 * // Call a tool
 * const result = await service.callTool({
 *   name: 'my-tool',
 *   arguments: { param: 'value' }
 * });
 * 
 * // List available tools
 * const tools = await service.listTools({});
 * ```
 */
export class SystemPromptService {
  private config: SystemPromptServiceConfig;

  /**
   * Creates a new SystemPrompt service instance
   * 
   * @param config - Configuration object containing API key and optional base URL
   */
  constructor(config: SystemPromptServiceConfig) {
    this.config = config;
  }

  /**
   * Calls a tool through the SystemPrompt API
   * 
   * @param request - The tool call request containing tool name and arguments
   * @returns The tool execution result from SystemPrompt
   * @throws {Error} Thrown if the API request fails
   * 
   * @remarks
   * This method sends a tool execution request to the SystemPrompt API.
   * The request is authenticated using the configured API key.
   * 
   * @example
   * ```typescript
   * const result = await service.callTool({
   *   name: 'reddit_search',
   *   arguments: {
   *     query: 'typescript tutorials',
   *     limit: 10
   *   }
   * });
   * ```
   */
  async callTool(request: CallToolRequest): Promise<any> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.systemprompt.io'}/v1/tools/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`SystemPrompt API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Lists available tools from the SystemPrompt API
   * 
   * @param request - The list tools request (can include filters)
   * @returns List of available tools with their metadata
   * @throws {Error} Thrown if the API request fails
   * 
   * @remarks
   * This method retrieves the list of tools available through SystemPrompt.
   * The response includes tool names, descriptions, and parameter schemas.
   * 
   * @example
   * ```typescript
   * const tools = await service.listTools({});
   * 
   * tools.forEach(tool => {
   *   console.log(`${tool.name}: ${tool.description}`);
   * });
   * ```
   */
  async listTools(request: ListToolsRequest): Promise<any> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.systemprompt.io'}/v1/tools/list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`SystemPrompt API error: ${response.statusText}`);
    }

    return response.json();
  }
}