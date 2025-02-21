# System Prompt Google Integration Server

## Overview

This directory contains the configuration and metadata for the System Prompt Google Integration Server, which implements the Model Context Protocol (MCP) for Google services. It provides a standardized interface for AI agents to interact with Gmail and other Google APIs.

## Files

### `server-config.ts`

The main configuration file that exports:

- `serverConfig`: Server metadata and Google integration settings
- `serverCapabilities`: Server capability definitions

## Configuration Structure

### Server Configuration

```typescript
{
  name: string;           // "systemprompt-mcp-google"
  version: string;        // Current server version
  metadata: {
    name: string;         // "System Prompt Google Integration Server"
    description: string;  // Server description
    icon: string;         // "mdi:google"
    color: string;        // "blue"
    serverStartTime: number;  // Server start timestamp
    environment: string;  // process.env.NODE_ENV
    customData: {
      serverFeatures: string[];     // ["google-mail", "oauth2"]
      supportedAPIs: string[];      // ["gmail"]
      authProvider: string;         // "google-oauth2"
      requiredScopes: string[];     // OAuth2 scopes needed for Google API access
    }
  }
}
```

### Server Capabilities

```typescript
{
  capabilities: {
    resources: {
      listChanged: true,  // Support for resource change notifications
    },
    tools: {},           // Google API-specific tool capabilities
    prompts: {
      listChanged: true, // Support for prompt change notifications
    }
  }
}
```

## Usage

Import the configuration objects when setting up the MCP server:

```typescript
import { serverConfig, serverCapabilities } from "./config/server-config.js";
```

## Environment Variables

The server requires these environment variables:

- `NODE_ENV`: Runtime environment (development/production)
- `GOOGLE_CLIENT_ID`: OAuth2 client ID for Google API access
- `GOOGLE_CLIENT_SECRET`: OAuth2 client secret
- `GOOGLE_REDIRECT_URI`: OAuth2 redirect URI

## Features

The server provides these core features:

- **Gmail Integration**: Send, read, and manage emails
- **OAuth2 Authentication**: Secure Google API access
- **Resource Notifications**: Real-time updates for resource changes
- **MCP Compliance**: Full implementation of the Model Context Protocol

## Supported Google APIs

- Gmail API
- Additional Google APIs can be added through configuration

## Authentication

The server uses Google OAuth2 for authentication with the following scopes:

- `https://www.googleapis.com/auth/gmail.modify`

Additional scopes can be configured as needed for expanded API access.
