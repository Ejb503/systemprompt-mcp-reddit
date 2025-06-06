import {
  ListResourcesRequest,
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import { getAvailableActions, getRedditSchemas } from "./action-schema.js";
import { RedditService } from "../services/reddit/reddit-service.js";

function getResourceType(prefix: string): string {
  switch (prefix) {
    case "reddit_post":
    case "reddit_reply":
    case "reddit_comment":
      return "SendReddit";
    case "reddit_instructions":
      return "Configuration";
    case "reddit_subreddit_analysis":
      return "SummarizeContent";
    default:
      return "SummarizeContent";
  }
}

export async function handleListResources(
  request: ListResourcesRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<ListResourcesResult> {
  try {
    const systemPromptService = SystemPromptService.getInstance();
    let resources: any[] = [];

    // Only try to fetch SystemPrompt resources if API key is provided
    if (extra?.authInfo?.extra?.systempromptApiKey) {
      try {
        systemPromptService.setApiKey(extra.authInfo.extra.systempromptApiKey as string);
        const blocks = await systemPromptService.listBlocks();

        // Map blocks to resources
        resources = blocks.map((block) => ({
          uri: `resource:///block/${block.id}`,
          name: block.metadata.title || `Block ${block.id}`,
          description: block.metadata.description || `SystemPrompt block: ${block.prefix}`,
          mimeType: "text/plain",
        }));
      } catch (error) {
        console.warn("Failed to fetch SystemPrompt resources:", error);
        // Continue with empty resources instead of failing
      }
    }

    return { resources };
  } catch (error) {
    console.error("❌ Error in handleListResources:", error);
    throw new Error(
      `Failed to fetch blocks from systemprompt.io: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function handleResourceCall(
  request: ReadResourceRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<ReadResourceResult> {
  const authInfo = extra?.authInfo;

  try {
    const { uri } = request.params;

    // Handle Reddit config resource
    if (uri === "reddit://config") {
      if (!authInfo?.extra?.redditAccessToken) {
        throw new Error("Authentication required: Reddit access token not found");
      }

      // Create Reddit service with auth tokens from the request
      const redditService = new RedditService({
        accessToken: authInfo.extra.redditAccessToken as string,
        refreshToken: authInfo.extra.redditRefreshToken as string,
      });

      const config = await redditService.getRedditConfig();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(config, null, 2),
          },
        ],
      };
    }

    // Handle SystemPrompt block resources
    const match = uri.match(/^resource:\/\/\/block\/(.+)$/);
    if (!match) {
      throw new Error(
        "Invalid resource URI format - expected resource:///block/{id} or reddit://config",
      );
    }

    const blockId = match[1];

    // Check if SystemPrompt API key is available
    if (!authInfo?.extra?.systempromptApiKey) {
      throw new Error(
        "SystemPrompt API key is required to access block resources. Please provide X-SystemPrompt-API-Key header.",
      );
    }

    const systemPromptService = SystemPromptService.getInstance();
    systemPromptService.setApiKey(authInfo.extra.systempromptApiKey as string);
    const block = await systemPromptService.getBlock(blockId);

    return {
      contents: [
        {
          uri: uri,
          mimeType: "text/plain",
          text: block.content,
        },
      ],
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch block from systemprompt.io: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
