# Utils Directory

## Purpose

This directory contains utility functions and helpers that provide reusable functionality across the application. These utilities handle common tasks like validation, data transformation, and protocol mapping.

## Key Files

- `validation.ts`: Input validation utilities
- `reddit-transformers.ts`: Functions for transforming Reddit API data
- `mcp-mappers.ts`: Utilities for mapping between MCP protocol and internal formats
- `message-handlers.ts`: Functions for processing and formatting messages
- `tool-validation.ts`: Validation specific to tool inputs and outputs

## Functionality

### Validation

Validation utilities ensure that inputs and outputs meet expected formats:
- Schema-based validation for tool parameters
- Type checking and runtime validation
- Consistent error formatting

### Transformations

Transformation utilities convert between different data formats:
- External API responses to internal structures
- Internal data to MCP protocol formats
- Format normalization and standardization

### Mappers

Mapping utilities help with protocol compliance:
- Converting resources to MCP-compatible formats
- Transforming tools and prompts for protocol listing
- Formatting errors according to protocol requirements

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. **Replace API-Specific Transformers**:
   - Create new transformer files for your API (e.g., `twitter-transformers.ts`)
   - Implement conversion functions for your API responses

2. **Update Validators**:
   - Add validation logic specific to your domain
   - Implement validators for your tool parameters

3. **Maintain Common Utilities**:
   - Keep protocol-specific mappers and handlers
   - Reuse validation patterns for consistency

## Example

```typescript
// Example transformer

/**
 * Transforms raw API entities to internal format
 */
export function transformEntityFromAPI(apiEntity: ApiEntityResponse): YourEntity {
  return {
    id: apiEntity.id,
    name: apiEntity.display_name || 'Unnamed',
    created: new Date(apiEntity.created_at * 1000).toISOString(),
    attributes: {
      property1: apiEntity.properties?.prop1 || '',
      property2: parseInt(apiEntity.properties?.prop2 || '0', 10),
      property3: apiEntity.is_active === true
    }
  };
}

/**
 * Transforms internal entities to MCP resource format
 */
export function transformEntityToResource(entity: YourEntity): YourEntityResource {
  return {
    id: entity.id,
    type: 'your-api:entity',
    attributes: {
      name: entity.name,
      created: entity.created,
      ...entity.attributes
    }
  };
}

/**
 * Validates entity parameters
 */
export function validateEntityParams(params: unknown): asserts params is YourEntityParams {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters: must be an object');
  }
  
  const typedParams = params as YourEntityParams;
  
  if (typedParams.id && typeof typedParams.id !== 'string') {
    throw new Error('Invalid id parameter: must be a string');
  }
  
  if (typedParams.options) {
    validateEntityOptions(typedParams.options);
  }
}
```