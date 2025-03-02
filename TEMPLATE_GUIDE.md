# MCP Server Template Guide

This guide provides step-by-step instructions for creating a new MCP server based on the systemprompt-mcp-reddit template. By following these steps, you can build a Model Context Protocol server for any API integration.

## Getting Started

1. Clone the repository and rename it for your service:
   ```bash
   git clone https://github.com/Ejb503/systemprompt-mcp-reddit.git your-mcp-server
   cd your-mcp-server
   ```

2. Update package information:
   - Edit `package.json` to change name, version, description, and repository
   - Update the README.md file with your service details

3. Clean up Reddit-specific code:
   - Remove Reddit-specific services and replace with your own
   - Update environment variables and configuration

## Implementation Steps

### Step 1: Define Your Types

Start by defining the core types for your domain:

1. Create a new file in `/src/types/` (e.g., `your-service.ts`)
2. Define interfaces for your API data structures
3. Create types for request/response formats
4. Define tool parameter and result types
5. Update `index.ts` to export your new types

### Step 2: Implement Your Services

Replace the Reddit services with your own:

1. Create a new directory in `/src/services/` (e.g., `/your-service/`)
2. Implement your authentication service
3. Create a base service for common API functionality
4. Implement specialized services for different API operations
5. Create a main service facade to coordinate the specialized services
6. Update `index.ts` to export your services

### Step 3: Define Your Tools

Define the tools that will be available through your MCP server:

1. Create tool schemas in `/src/constants/tool/`
2. Implement tool handlers in `/src/handlers/tools/`
3. Update `index.ts` in the tools directory to export your handlers
4. Update `constants/tools.ts` to register your tools

### Step 4: Update Server Configuration

Configure your server capabilities:

1. Update `config/server-config.ts` with:
   - Your server name, version, and description
   - Tool definitions
   - Resource definitions
   - Prompt configurations
   - Sampling capabilities

### Step 5: Implement Transformers

Create data transformation utilities:

1. Create transformers in `/src/utils/` for your API data
2. Implement functions to convert between:
   - API responses and internal formats
   - Internal formats and MCP resources
   - Request parameters and API calls

### Step 6: Update Environment Configuration

Set up environment variables:

1. Update `.env.example` with required variables for your service
2. Document the required variables in the README
3. Update the initialization checks in `index.ts`

### Step 7: Add Sampling and Notifications (Optional)

If your service requires LLM sampling or notifications:

1. Create sampling templates in `/src/constants/sampling/`
2. Implement callback handlers in `/src/handlers/callbacks/`
3. Update notification handlers in `handlers/notifications.ts`

### Step 8: Test Your Implementation

Create tests for your implementation:

1. Add mock responses in `/__mocks__/`
2. Create unit tests for your services
3. Test tool handlers and validation
4. Verify configuration and initialization

## Example Implementation Pattern

Here's a simplified pattern for implementing a new API integration:

### Service Implementation

```typescript
// services/your-service/your-service.ts
export class YourService {
  private static instance: YourService;
  private authService: YourAuthService;
  private operationService: YourOperationService;

  private constructor() {
    this.authService = YourAuthService.getInstance();
    this.operationService = YourOperationService.getInstance();
  }

  public static getInstance(): YourService {
    if (!YourService.instance) {
      YourService.instance = new YourService();
    }
    return YourService.instance;
  }

  public async initialize(): Promise<void> {
    await this.authService.initialize();
  }

  public async performOperation(params: OperationParams): Promise<OperationResult> {
    return this.operationService.performOperation(params);
  }
}
```

### Tool Handler Implementation

```typescript
// handlers/tools/your-operation.ts
export async function handleYourOperation(
  params: YourOperationParams,
  context: RequestContext
): Promise<YourOperationResult> {
  try {
    validateYourOperationParams(params);
    
    const service = YourService.getInstance();
    const result = await service.performOperation(params);
    
    return {
      success: true,
      data: transformOperationResult(result)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

### Tool Schema Definition

```typescript
// constants/tool/your-operation.ts
export const YOUR_OPERATION_SCHEMA = {
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

export const YOUR_OPERATION_RESULT_SCHEMA = {
  type: "object",
  required: ["success"],
  properties: {
    success: {
      type: "boolean",
      description: "Whether the operation was successful"
    },
    data: {
      type: "object",
      description: "The result data if successful"
    },
    error: {
      type: "string",
      description: "Error message if the operation failed"
    }
  }
};
```

## Best Practices

1. **Follow Established Patterns**: Maintain the architectural patterns in the template
2. **Keep Separation of Concerns**: 
   - Services handle API interaction
   - Handlers manage protocol requests
   - Utils provide reusable functionality
3. **Use Strong Typing**: Define interfaces for all data structures
4. **Handle Errors Consistently**: Implement proper error handling in all operations
5. **Document Your Code**: Add comments and update README files
6. **Test Thoroughly**: Write unit tests for critical functionality

## Troubleshooting

- **Authentication Issues**: Verify your API credentials and token refresh logic
- **Schema Validation Errors**: Ensure your tool schemas match your implementation
- **Type Errors**: Check interface definitions and type assertions
- **MCP Protocol Errors**: Verify your server configuration matches the MCP specification

## Conclusion

By following this guide and the patterns established in the systemprompt-mcp-reddit codebase, you can quickly implement new MCP servers for different APIs while maintaining compatibility with the Model Context Protocol specification.