# Services Directory Documentation

## Overview

This directory contains service implementations that handle external integrations and business logic for the MCP server. The services are organized into two main categories:

1. System Prompt Services - For interacting with the systemprompt.io API
2. Google Services - For interacting with various Google APIs (Gmail, Calendar, etc.)

## Service Architecture

### Base Services

#### `google-base-service.ts`

An abstract base class that provides common functionality for all Google services:

```typescript
abstract class GoogleBaseService {
  protected auth: GoogleAuthService;

  constructor();
  protected waitForInit(): Promise<void>;
}
```

Features:

- Automatic authentication initialization
- Shared auth instance management
- Error handling for auth failures

### Core Services

#### `systemprompt-service.ts`

A singleton service for interacting with the systemprompt.io API:

```typescript
class SystemPromptService {
  private static instance: SystemPromptService | null = null;

  static initialize(apiKey: string, baseUrl?: string): void;
  static getInstance(): SystemPromptService;
  static cleanup(): void;

  // Prompt Operations
  async getAllPrompts(): Promise<SystempromptPromptResponse[]>;

  // Block Operations
  async listBlocks(): Promise<SystempromptBlockResponse[]>;
  async getBlock(blockId: string): Promise<SystempromptBlockResponse>;
}
```

Features:

- Singleton pattern with API key initialization
- Comprehensive error handling with specific error types
- Configurable API endpoint
- Type-safe request/response handling

#### `google-auth-service.ts`

Manages Google OAuth2 authentication:

```typescript
class GoogleAuthService {
  static getInstance(): GoogleAuthService;
  async initialize(): Promise<void>;
  async authenticate(): Promise<void>;
}
```

#### `gmail-service.ts`

Handles Gmail API interactions:

```typescript
class GmailService extends GoogleBaseService {
  // Email operations
  async listMessages(): Promise<GmailMessage[]>;
  async sendEmail(): Promise<void>;
  // ... other Gmail operations
}
```

## Implementation Details

### Error Handling

All services implement comprehensive error handling:

```typescript
try {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    switch (response.status) {
      case 403:
        throw new Error("Invalid API key");
      case 404:
        throw new Error("Resource not found");
      // ... other status codes
    }
  }
} catch (error) {
  throw new Error(`API request failed: ${error.message}`);
}
```

### Authentication

#### System Prompt Authentication

- API key-based authentication
- Key passed via headers
- Environment variable configuration

#### Google Authentication

- OAuth2 flow
- Automatic token refresh
- Scoped access for different services

## Usage Examples

### System Prompt Service

```typescript
// Initialize
SystemPromptService.initialize(process.env.SYSTEMPROMPT_API_KEY);
const service = SystemPromptService.getInstance();

// Get all prompts
const prompts = await service.getAllPrompts();

// List blocks
const blocks = await service.listBlocks();
```

### Google Services

```typescript
// Gmail
const gmailService = new GmailService();
await gmailService.waitForInit();
const messages = await gmailService.listMessages();
```

## Testing

All services have corresponding test files in the `__tests__` directory:

- `systemprompt-service.test.ts`
- `gmail-service.test.ts`
- `google-auth-service.test.ts`
- `google-base-service.test.ts`

Tests cover:

- Service initialization
- API interactions
- Error handling
- Authentication flows
