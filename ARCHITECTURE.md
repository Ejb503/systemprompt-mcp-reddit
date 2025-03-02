# SystemPrompt MCP Reddit Architecture

This document outlines the architecture and structure of the SystemPrompt MCP Reddit server, which can serve as a template for creating other Model Context Protocol (MCP) servers.

## Overview

SystemPrompt MCP Reddit is a specialized server that enables AI agents to interact with Reddit through the Model Context Protocol. It implements the full MCP specification including tools, resources, prompts, sampling, and notifications.

The project follows a modular architecture with clear separation of concerns, making it adaptable for other API integrations beyond Reddit.

## Core Components

### MCP Protocol Implementation

The server implements the complete Model Context Protocol:

- **Tools**: Defined operations that AI can use to interact with Reddit
- **Resources**: Data structures representing Reddit content
- **Prompts**: Pre-defined prompts for certain Reddit interactions
- **Sampling**: LLM-based content generation with callbacks
- **Notifications**: System state updates to connected clients

### Service Integration

The service layer abstracts Reddit API interactions through:

- OAuth authentication with refresh token support
- Rate limiting and error handling
- Data transformation and normalization
- Operation-specific services (posts, comments, subreddits)

## Directory Structure

The codebase is organized into specialized directories:

### `/src` - Root Source Directory

The main entry point (`index.ts`) initializes the server and connects to transport. The server module (`server.ts`) creates and configures the MCP server instance.

### `/src/config`

**Purpose**: Configuration management for the MCP server.

Key files:
- `server-config.ts`: Defines server capabilities, metadata, and supported features

This directory maintains all configuration-related code, allowing easy modification of server capabilities and protocol implementation details.

### `/src/constants`

**Purpose**: Centralized definition of constants used throughout the application.

Subdirectories:
- `/tool`: Schemas for all supported tools
- `/sampling`: Templates for LLM content generation

This directory provides a single source of truth for system constants, making it easy to add or modify functionality.

### `/src/handlers`

**Purpose**: Request handling logic for different MCP protocol operations.

Key files:
- `tool-handlers.ts`: Routes tool calls to implementations
- `resource-handlers.ts`: Manages resource access
- `prompt-handlers.ts`: Handles prompt requests
- `sampling.ts`: Processes LLM sampling requests
- `notifications.ts`: Manages system notifications

Subdirectories:
- `/tools`: Individual implementations for each tool
- `/callbacks`: Callback handlers for sampling operations

The handlers layer translates MCP protocol requests into service operations, maintaining a clean separation between protocol and business logic.

### `/src/services`

**Purpose**: Service implementations for external API interactions.

Subdirectories:
- `/reddit`: Specialized services for Reddit operations
  - `reddit-auth-service.ts`: Authentication management
  - `reddit-fetch-service.ts`: Base class for API requests
  - `reddit-post-service.ts`: Post-related operations
  - `reddit-subreddit-service.ts`: Subreddit management
  - `reddit-service.ts`: Main facade coordinating other services

- `systemprompt-service.ts`: Integration with SystemPrompt.io API

The services layer encapsulates all external API interactions, making it the primary target for adaptation when creating new MCP servers.

### `/src/types`

**Purpose**: TypeScript type definitions for the entire system.

Key files:
- `reddit.ts`: Reddit-specific data structures
- `config.ts`: Configuration type definitions
- `sampling.ts`: Types for LLM sampling
- `systemprompt.ts`: Types for SystemPrompt integration

Strong typing ensures consistency and provides documentation for the expected data structures.

### `/src/utils`

**Purpose**: Utility functions and helpers.

Key files:
- `validation.ts`: Input validation
- `reddit-transformers.ts`: Data transformation
- `mcp-mappers.ts`: Protocol mapping utilities
- `message-handlers.ts`: Message processing

Utilities provide reusable functionality across the application, simplifying the implementation of business logic.

## Key Design Patterns

The codebase implements several design patterns:

1. **Singleton Pattern**: Service instances are managed as singletons
2. **Facade Pattern**: `RedditService` coordinates specialized services
3. **Strategy Pattern**: Tool handlers use specialized implementations
4. **Factory Pattern**: Response formatting and object creation
5. **Dependency Injection**: Context passing to handlers

## Adapting for New MCP Servers

To create a new MCP server based on this template:

1. **Replace Service Layer**: Implement new service classes for the target API
   - Create specialized services for different API domains
   - Implement authentication appropriate for the target API
   - Transform API responses to consistent formats

2. **Define New Tools**: Create tool definitions and handlers
   - Add tool schemas in `/constants/tool/`
   - Implement handlers in `/handlers/tools/`
   - Register tools in the server configuration

3. **Create Type Definitions**: Define TypeScript interfaces
   - Create API-specific types
   - Update configuration types if needed
   - Define resource types for the new domain

4. **Update Sampling**: Modify sampling templates
   - Adjust prompts for the new domain
   - Implement domain-specific callbacks

5. **Update Configuration**: Modify server capabilities
   - Update server name, version, and description
   - Configure supported features

## Best Practices

When extending this architecture:

1. **Maintain Clear Boundaries**: Keep protocol handling separate from business logic
2. **Use Strong Typing**: Define interfaces for all data structures
3. **Centralize Constants**: Keep schemas and definitions in the constants directory
4. **Follow Existing Patterns**: Use the established patterns for consistency
5. **Implement Comprehensive Validation**: Validate all inputs and outputs
6. **Handle Errors Gracefully**: Implement proper error handling and reporting

## Conclusion

The SystemPrompt MCP Reddit server provides a robust, well-structured template for building other MCP servers. By following the patterns established in this codebase, developers can quickly implement new MCP servers for different APIs while maintaining compatibility with the Model Context Protocol specification.