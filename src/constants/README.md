# Constants Directory

## Purpose

This directory centralizes all constant definitions used throughout the application, including tool schemas, sampling templates, error messages, and other configuration constants.

## Structure

- `/constants/tool/` - Schema definitions for all available tools
- `/constants/sampling/` - Templates for LLM-based content generation
- `message-handler.ts` - Constants for message processing
- `tools.ts` - Tool-related constants and registration

## Key Components

### Tool Schemas

The `tool` subdirectory contains schema definitions for each tool, including:
- Input parameters and their validation rules
- Output formats and structures
- Tool descriptions and documentation

### Sampling Templates

The `sampling` subdirectory contains templates for generating content with LLMs:
- Prompt structures for different content types
- Response formatting guidelines
- Context requirements

### Global Constants

The root level contains system-wide constants:
- API endpoints and URLs
- Rate limiting parameters
- Default values
- Error message definitions

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. Define new tool schemas in the `tool` directory
2. Create sampling templates specific to your domain
3. Update constants for your target API (URLs, rate limits, etc.)
4. Define error messages for your specific integration

## Example

```typescript
// Example tool schema
export const YOUR_TOOL_SCHEMA = {
  type: "object",
  required: ["parameter1"],
  properties: {
    parameter1: {
      type: "string",
      description: "Description of parameter1"
    },
    parameter2: {
      type: "number",
      description: "Description of parameter2"
    }
  }
};

// Example sampling template
export const YOUR_CONTENT_TEMPLATE = {
  system: `Instructions for generating content related to your domain.`,
  user: `Please create content based on the following context: {{context}}`
};

// Example global constants
export const YOUR_API_BASE_URL = "https://api.your-service.com";
export const DEFAULT_RATE_LIMIT = 60; // requests per minute
```