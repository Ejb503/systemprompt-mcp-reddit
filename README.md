# systemprompt-mcp-reddit

[![npm version](https://img.shields.io/npm/v/systemprompt-mcp-reddit.svg)](https://www.npmjs.com/package/systemprompt-mcp-reddit)
[![smithery badge](https://smithery.ai/badge/systemprompt-mcp-reddit)](https://smithery.ai/server/systemprompt-mcp-reddit)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Twitter Follow](https://img.shields.io/twitter/follow/tyingshoelaces_?style=social)](https://twitter.com/tyingshoelaces_)
[![Discord](https://img.shields.io/discord/1255160891062620252?color=7289da&label=discord)](https://discord.com/invite/wkAbSuPWpr)

[Website](https://systemprompt.io) | [Documentation](https://systemprompt.io/documentation) | [Blog](https://tyingshoelaces.com) | [Get API Key](https://systemprompt.io/console)

A specialized Model Context Protocol (MCP) server that enables AI agents to interact with Reddit, including reading posts, creating content, and managing subreddit configurations. The server is designed to work specifically with [systemprompt.io](https://systemprompt.io) client that support sampling and notification features, and may not function properly with other MCP clients.

An API KEY is required to use this server. This is currently free, although this may change in the future. You can get one [here](https://systemprompt.io/console).

This server uses Sampling and Notification functionality from the [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk).

## Features

#### Core Functionality

- **Subreddit Configuration**: Configure and manage multiple subreddits for the AI agent
- **Content Retrieval**: Fetch hot, new, or controversial posts from configured subreddits
- **Content Creation**: Generate AI-powered posts and replies with customizable parameters
- **Writing Style Control**: Configure tone, vocabulary, and content guidelines for the AI

#### Advanced Features

- **Rule Compliance**: Automatic adherence to subreddit rules and requirements
- **Content Guidelines**: Customizable instructions for content generation
- **Flexible Post Types**: Support for both text and link posts
- **Smart Replies**: Context-aware response generation

#### Integration Features

- **MCP Protocol Integration**: Full implementation of Model Context Protocol
- **Type-Safe Implementation**: Complete TypeScript support
- **Real-Time Processing**: Supports streaming responses
- **Advanced Error Handling**: Comprehensive error management

## System Architecture

This project follows a modular architecture designed to be adaptable for other MCP server implementations:

### Core Components

- **MCP Protocol Layer**: Implements the complete Model Context Protocol
- **Service Layer**: Abstracts Reddit API interactions
- **Handler Layer**: Routes and processes MCP requests
- **Tool Layer**: Defines operations AI agents can perform
- **Utility Layer**: Provides helpers for validation and data transformation

### Directory Structure

- `/src/config`: Server configuration and capabilities
- `/src/constants`: Tool schemas, sampling templates, and system constants
- `/src/handlers`: Request handlers and tool implementations
- `/src/services`: API integration services
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions and helpers

For detailed documentation of the architecture and implementation patterns, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md): Complete system overview
- [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md): Guide for creating new MCP servers

## Using as a Template

This codebase is designed to serve as a template for creating other MCP servers. The modular architecture makes it straightforward to replace the Reddit integration with other APIs:

1. Replace the service layer with your API implementation
2. Define new tools appropriate for your domain
3. Update type definitions and schemas
4. Configure server capabilities

See [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md) for detailed step-by-step instructions.

## 🎥 Demo & Showcase

Watch our video demonstration to see Systemprompt MCP Reddit in action:

[▶️ Watch Demo Video](https://www.youtube.com/watch?v=NyXkfVAv7OE)

## Related Links

- [Multimodal MCP Client](https://github.com/Ejb503/multimodal-mcp-client) - Voice-powered MCP client
- [systemprompt.io Documentation](https://systemprompt.io/docs)