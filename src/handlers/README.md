# Handlers Directory

## Purpose

This directory contains request handlers that process MCP protocol messages, manage tool executions, and coordinate with services to fulfill client requests.

## Key Files

- `tool-handlers.ts`: Routes tool calls to their specific implementations
- `resource-handlers.ts`: Lists and retrieves resources
- `prompt-handlers.ts`: Lists and retrieves prompts
- `sampling.ts`: Handles LLM sampling requests
- `notifications.ts`: Manages system notifications
- `callbacks.ts`: Processes responses from sampling operations
- `action-schema.ts`: Defines schemas for actions

## Subdirectories

- `/tools/`: Individual handler implementations for each tool
- `/callbacks/`: Handler implementations for sampling callbacks

## Pattern

Handlers follow a consistent pattern:
1. Validate incoming request data
2. Access the appropriate service
3. Execute the requested operation
4. Format and return the response
5. Handle errors consistently

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. **Create Tool Handlers**:
   - Create handler functions for each of your tools in the `/tools/` directory
   - Update the `index.ts` file in the `/tools/` directory to export all handlers
   - Ensure handlers validate inputs according to your schemas

2. **Update Resource Handlers**:
   - Modify `resource-handlers.ts` to handle your specific resources
   - Implement the appropriate data fetching for your API

3. **Customize Sampling**:
   - Update `sampling.ts` to use your domain-specific templates
   - Implement callback handlers for your sampling operations

4. **Implement Notifications**:
   - Update `notifications.ts` to send appropriate notifications for your system

## Example

```typescript
// Example tool handler
export async function handleYourTool(
  params: YourToolParams,
  context: RequestContext
): Promise<YourToolResult> {
  try {
    // Validate params if needed
    validateYourToolParams(params);
    
    // Access the service
    const service = YourService.getInstance();
    
    // Execute the operation
    const result = await service.performOperation(params);
    
    // Return formatted result
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // Handle errors
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```