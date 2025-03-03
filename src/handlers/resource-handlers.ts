import {
  ReadResourceRequest,
  ListResourcesResult,
  ReadResourceResult,
  ListResourcesRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import { getAvailableActions, getRedditSchemas } from "./action-schema.js";

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
): Promise<ListResourcesResult> {
  const systemPromptService = SystemPromptService.getInstance();

  const blocks = await systemPromptService.listBlocks({
    tags: ["mcp_systemprompt_reddit"],
  });

  const resources = blocks.map((block: SystempromptBlockResponse) => {
    return {
      uri: `resource:///block/${block.id}`,
      name: block.prefix,
      _meta: {
        actions: getAvailableActions(block.prefix),
        schema: getRedditSchemas(block.prefix),
        server_id: "5bd646cc-f499-4a37-9ebd-0fae39037bd8",
        type: getResourceType(block.prefix),
        title: block.metadata.title,
        description: block.metadata.description,
        initialData: JSON.parse(block.content),
        uuid: block.id,
      },
    };
  });

  return {
    resources,
  };
}

export async function handleResourceCall(
  request: ReadResourceRequest,
): Promise<ReadResourceResult> {
  const { uri } = request.params;
  const match = uri.match(/^resource:\/\/\/block\/(.+)$/);

  if (!match) {
    throw new Error("Invalid resource URI format - expected resource:///block/{id}");
  }

  const blockId = match[1];
  const systemPromptService = SystemPromptService.getInstance();

  try {
    const block = await systemPromptService.getBlock(blockId);
    let initialData = undefined;
    if (
      block.prefix === "reddit_post" ||
      block.prefix === "reddit_reply" ||
      block.prefix === "reddit_comment"
    ) {
      try {
        initialData = JSON.parse(block.content);
      } catch (error) {
        // If content is not valid JSON, use it as is
        initialData = { content: block.content };
      }
    }

    return {
      contents: [
        {
          uri: uri,
          mimeType: "text/plain",
          text: block.content,
        },
      ],
      _meta: {
        actions: getAvailableActions(block.prefix),
        schema: getRedditSchemas(block.prefix),
        server_id: "5bd646cc-f499-4a37-9ebd-0fae39037bd8",
        type: getResourceType(block.prefix),
        title: block.metadata.title,
        description: block.metadata.description,
        initialData: JSON.parse(block.content),
        uuid: block.id,
      },
    };
  } catch (error) {
    throw new Error(
      `Resource not found: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
