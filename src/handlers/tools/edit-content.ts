import { ToolHandler, EditContentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";

export const handleEditContent: ToolHandler<EditContentArgs> = async (
  args,
  { systemPromptService, hasSystemPromptApiKey },
) => {
  try {
    if (!hasSystemPromptApiKey) {
      throw new RedditError(
        "SystemPrompt API key is required to edit content. Please provide X-SystemPrompt-API-Key header.",
        "API_ERROR",
      );
    }
    const block: Partial<SystempromptBlockRequest> = {
      content: args.content,
    };
    await systemPromptService.updateBlock(args.id, block);

    return formatToolResponse({
      message: `Notification: Successfully edited content for ${args.id}`,
      type: "api",
      title: "Edit Content",
    });
  } catch (error) {
    throw new RedditError(
      `Failed to edit content for ${args.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR",
    );
  }
};
