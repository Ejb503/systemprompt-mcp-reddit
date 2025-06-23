import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  ListResourcesRequest,
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { RedditService } from '../services/reddit/reddit-service';


import { getAvailableActions, getRedditSchemas } from './action-schema';


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
    const resources = [
      {
        uri: "reddit://config",
        name: "Reddit Configuration",
        description: "Current Reddit authentication and configuration settings",
        mimeType: "application/json",
      },
    ];

    return { resources };
  } catch (error) {
    console.error("❌ Error in handleListResources:", error);
    throw new Error(
      `Failed to list resources: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    throw new Error(
      "Invalid resource URI format - only reddit://config is supported",
    );
  } catch (error) {
    throw new Error(
      `Failed to fetch resource: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
