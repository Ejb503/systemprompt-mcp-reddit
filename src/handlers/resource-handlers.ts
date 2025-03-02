import {
  ReadResourceRequest,
  ListResourcesResult,
  ReadResourceResult,
  ListResourcesRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import {
  ACTIONS,
  getAvailableActions,
  getRedditSchemas,
  createResourceMetadata,
} from "./action-schema.js";

const PREFIX_SATISFIES_MAP = {
  reddit_instructions: [ACTIONS.CONFIGURE_INSTRUCTIONS],
  reddit_post: [ACTIONS.CREATE_POST],
  reddit_reply: [ACTIONS.CREATE_REPLY],
};

function getResourceType(prefix: string): string {
  switch (prefix) {
    case "reddit_post":
    case "reddit_reply":
      return "SendReddit";
    case "reddit_instructions":
      return "EditContent";
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
    let initialData = undefined;
    if (block.prefix === "reddit_post" || block.prefix === "reddit_reply") {
      try {
        initialData = JSON.parse(block.content);
      } catch (error) {
        initialData = { content: block.content };
      }
    }
    return {
      uri: `resource:///block/${block.id}`,
      name: block.prefix,
      _meta: {
        actions: getAvailableActions(block.prefix),
        schema: getRedditSchemas(block.prefix),
        server_id: "5bd646cc-f499-4a37-9ebd-0fae39037bd8",
        ...(initialData && { initialData }),
        type: getResourceType(block.prefix),
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
    const satisfies = PREFIX_SATISFIES_MAP[block.prefix as keyof typeof PREFIX_SATISFIES_MAP] || [];
    let initialData = undefined;
    if (block.prefix === "reddit_post" || block.prefix === "reddit_reply") {
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
        ...createResourceMetadata(block),
        availableActions: getAvailableActions(block.prefix),
        schema: getRedditSchemas(block.prefix),
        server_id: "5bd646cc-f499-4a37-9ebd-0fae39037bd8",
        satisfies,
        ...(initialData && { initialData }),
      },
    };
  } catch (error) {
    throw new Error(
      `Resource not found: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
