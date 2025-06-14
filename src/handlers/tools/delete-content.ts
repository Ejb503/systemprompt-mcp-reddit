import { updateBlocks } from "../notifications.js";
import { ToolHandler, DeleteContentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";

export const handleDeleteContent: ToolHandler<DeleteContentArgs> = async (
  args,
  { systemPromptService, hasSystemPromptApiKey },
) => {
  try {
    if (!hasSystemPromptApiKey) {
      throw new RedditError(
        "SystemPrompt API key is required to delete content. Please provide X-SystemPrompt-API-Key header.",
        "API_ERROR",
      );
    }
    await systemPromptService.deleteBlock(args.id);
    updateBlocks();
    return formatToolResponse({
      message: `Successfully deleted content for ${args.id}`,
      type: "api",
      title: "Delete Content",
    });
  } catch (error) {
    throw new RedditError(
      `Failed to delete content for ${args.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR",
    );
  }
};
