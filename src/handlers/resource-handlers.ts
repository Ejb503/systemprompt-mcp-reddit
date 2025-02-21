import {
  ReadResourceRequest,
  ListResourcesResult,
  ReadResourceResult,
  ListResourcesRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";

export async function handleListResources(
  request: ListResourcesRequest,
): Promise<ListResourcesResult> {
  const systemPromptService = SystemPromptService.getInstance();

  // Get all blocks with the mcp_systemprompt_reddit tag
  const blocks = await systemPromptService.listBlocks({
    tags: ["mcp_systemprompt_reddit"],
  });

  // Filter for blocks with reddit_message or reddit_reply prefix
  const redditBlocks = blocks.filter(
    (block) => block.prefix === "reddit_message" || block.prefix === "reddit_reply",
  );

  // Convert blocks to resource URIs
  const resources = redditBlocks.map((block) => ({
    uri: `resource:///block/${block.id}`,
    name: block.prefix,
  }));

  return {
    resources,
    _meta: {},
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

    return {
      contents: [
        {
          uri: uri,
          mimeType: "text/plain",
          text: block.content,
        },
      ],
      _meta: { tag: ["agent"] },
    };
  } catch (error) {
    throw new Error("Resource not found");
  }
}
