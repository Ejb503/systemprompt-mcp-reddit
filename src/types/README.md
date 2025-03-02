# Types Directory

## Purpose

This directory contains TypeScript type definitions for the entire application, ensuring type safety and providing documentation for data structures.

## Key Files

- `index.ts`: Exports all types for easy access
- `config.ts`: Types related to server configuration
- `reddit.ts`: Reddit-specific data structures and interfaces
- `sampling.ts`: Types for LLM sampling operations
- `sampling-schemas.ts`: JSON schemas for sampling validation
- `systemprompt.ts`: Types for SystemPrompt.io integration

## Structure

Types are organized by domain and function, with clear interfaces for:

- External API data structures
- Internal representations
- Request and response formats
- Configuration options
- Tool parameters and results

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. **Create Domain-Specific Types**:
   - Replace `reddit.ts` with types for your API (e.g., `twitter.ts`)
   - Define interfaces for all API objects
   - Create types for request parameters and responses

2. **Update Configuration Types**:
   - Modify `config.ts` if your server needs additional configuration options

3. **Adjust Sampling Types**:
   - Update `sampling.ts` with any domain-specific sampling requirements

4. **Maintain Common Types**:
   - Keep utility types that are platform-agnostic

## Example

```typescript
// Example domain-specific types

// Entity types
export interface YourEntity {
  id: string;
  name: string;
  created: string;
  attributes: YourEntityAttributes;
}

export interface YourEntityAttributes {
  property1: string;
  property2: number;
  property3?: boolean;
}

// Request/response types
export interface CreateEntityRequest {
  name: string;
  attributes?: Partial<YourEntityAttributes>;
}

export interface CreateEntityResponse {
  success: boolean;
  entity?: YourEntity;
  error?: string;
}

// Tool parameter types
export interface YourToolParams {
  entityId?: string;
  query?: string;
  options?: YourToolOptions;
}

export interface YourToolOptions {
  limit?: number;
  includeDeleted?: boolean;
  sortBy?: 'created' | 'name' | 'relevance';
}

// Tool result types
export interface YourToolResult {
  success: boolean;
  data?: YourEntity[];
  error?: string;
  metadata?: {
    total: number;
    page: number;
    hasMore: boolean;
  };
}
```