# Services Directory

## Purpose

This directory contains service implementations that handle external API interactions, data processing, and business logic. Services encapsulate all the complexity of working with external systems, providing a clean interface for handlers.

## Key Components

- `/reddit/`: Services specific to Reddit API integration
- `systemprompt-service.ts`: Service for interacting with SystemPrompt.io API

## Reddit Services

The `/reddit/` directory follows a specialized structure:

- `reddit-auth-service.ts`: Handles authentication, token refresh, and authorization
- `reddit-fetch-service.ts`: Base class with common functionality for API requests
- `reddit-post-service.ts`: Manages post-related operations (create, fetch, edit)
- `reddit-subreddit-service.ts`: Handles subreddit-specific operations
- `reddit-service.ts`: Main facade that coordinates specialized services
- `index.ts`: Exports the services for external use

## Design Patterns

The services implement several design patterns:

1. **Singleton Pattern**: Services are implemented as singletons for global access
2. **Facade Pattern**: The main service coordinates specialized services
3. **Inheritance**: Base service classes provide common functionality
4. **Error Handling**: Consistent error handling and reporting

## Extending for New MCP Servers

When adapting this template for a new MCP server:

1. **Replace Reddit Services**:
   - Create a new directory for your API services (e.g., `/twitter/`)
   - Implement specialized services for different aspects of your API
   - Create a main facade service to coordinate the specialized services

2. **Authentication**:
   - Implement authentication appropriate for your API
   - Manage tokens, refreshes, and authorization headers

3. **API Interaction**:
   - Create base classes for common API interaction patterns
   - Implement rate limiting and retry logic
   - Handle API-specific error responses

4. **Data Transformation**:
   - Convert API responses to consistent internal formats
   - Implement mappers for your domain entities

## Example

```typescript
// Example service implementation

// Main service facade
export class YourAPIService {
  private static instance: YourAPIService;
  private authService: YourAuthService;
  private entityService: YourEntityService;
  
  private constructor() {
    this.authService = YourAuthService.getInstance();
    this.entityService = YourEntityService.getInstance();
  }
  
  public static getInstance(): YourAPIService {
    if (!YourAPIService.instance) {
      YourAPIService.instance = new YourAPIService();
    }
    return YourAPIService.instance;
  }
  
  public async initialize(): Promise<void> {
    await this.authService.initialize();
  }
  
  public async getEntity(id: string): Promise<YourEntity> {
    return this.entityService.getEntity(id);
  }
  
  // Additional methods coordinating the specialized services
}

// Specialized service
export class YourEntityService {
  private static instance: YourEntityService;
  
  private constructor() {}
  
  public static getInstance(): YourEntityService {
    if (!YourEntityService.instance) {
      YourEntityService.instance = new YourEntityService();
    }
    return YourEntityService.instance;
  }
  
  public async getEntity(id: string): Promise<YourEntity> {
    // Implementation details
  }
}
```