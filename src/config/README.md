# Configuration Directory

## Purpose

This directory contains configuration files for the MCP server that define its capabilities, supported features, and operational parameters.

## Key Files

- `server-config.ts`: Defines the server's capabilities, metadata, and available features:
  - Server name, version, and description
  - Supported tools with their schemas
  - Available resources with access patterns
  - Supported prompts and their schemas
  - Sampling capabilities

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. Update the server metadata (name, version, description)
2. Define the tools appropriate for your target API
3. Configure resources that represent your domain entities
4. Define prompts specific to your application domain
5. Configure sampling capabilities if needed

## Example

```typescript
// Partial example from server-config.ts
export const SERVER_CONFIG: ServerConfig = {
  name: "your-new-service-name",
  version: "1.0.0",
  description: "MCP server for [your service]",
  
  // Define tools specific to your API
  tools: {
    "your-api:action": {
      name: "your-api:action",
      description: "Performs an action with your API",
      inputSchema: YOUR_ACTION_SCHEMA,
      outputSchema: YOUR_RESULT_SCHEMA
    }
  },
  
  // Define resources for your domain
  resources: {
    "your-api:entity": {
      name: "your-api:entity",
      description: "An entity from your API",
      schema: YOUR_ENTITY_SCHEMA
    }
  }
};
```