import {
  ReadResourceRequest,
  ListResourcesResult,
  ReadResourceResult,
  ListResourcesRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockResponse } from "@/types/systemprompt.js";
import {
  getRedditSchemas,
  createResourceMetadata,
  getAvailableActions,
  assertRedditPostArgs,
  assertRedditReplyArgs,
  ACTIONS,
} from "../utils/reddit-resource-utils.js";

const PREFIX_SATISFIES_MAP = {
  reddit_config: ["configure_reddit"],
  reddit_instructions: ["configure_instructions"],
  reddit_post: [ACTIONS.CREATE_POST],
  reddit_reply: [ACTIONS.CREATE_REPLY],
};

export async function handleListResources(
  request: ListResourcesRequest,
): Promise<ListResourcesResult> {
  const systemPromptService = SystemPromptService.getInstance();

  const blocks = await systemPromptService.listBlocks({
    tags: ["mcp_systemprompt_reddit"],
  });

  // Filter for Reddit resources and convert to resource URIs
  const resources = blocks.map((block: SystempromptBlockResponse) => {
    // Determine what this block satisfies based on its prefix
    const satisfies = PREFIX_SATISFIES_MAP[block.prefix as keyof typeof PREFIX_SATISFIES_MAP] || [];

    // Parse content as initialData for reddit_post and reddit_reply
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
      uri: `resource:///block/${block.id}`,
      name: block.prefix,
      _meta: {
        actions: getAvailableActions(block.prefix),
        schema: getRedditSchemas(),
        server_id: "5bd646cc-f499-4a37-9ebd-0fae39037bd8",
        satisfies,
        ...(initialData && { initialData }),
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

    // Determine what this block satisfies based on its prefix
    const satisfies = PREFIX_SATISFIES_MAP[block.prefix as keyof typeof PREFIX_SATISFIES_MAP] || [];

    // Parse content as initialData for reddit_post and reddit_reply
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

export async function handleCreateRedditPost(args: unknown) {
  const typedArgs = assertRedditPostArgs(args);

  // Now you can use typedArgs with the correct type
  // typedArgs.subreddit, typedArgs.title, etc. are now properly typed

  // Your implementation...
}

export async function handleCreateRedditReply(args: unknown) {
  const typedArgs = assertRedditReplyArgs(args);
  // Your implementation...
}
