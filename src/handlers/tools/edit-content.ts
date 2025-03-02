import { ToolHandler, EditContentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";

export const handleEditContent: ToolHandler<EditContentArgs> = async (
  args,
  { systemPromptService },
) => {
  try {
    const block: Partial<SystempromptBlockRequest> = {
      content: args.content,
    };
    await systemPromptService.updateBlock(args.resourceId, block);

    return formatToolResponse({
      message: `Notification: Successfully edited content for ${args.resourceId}`,
      type: "api",
      title: "Edit Content",
    });
  } catch (error) {
    throw new RedditError(
      `Failed to edit content for ${args.resourceId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR",
    );
  }
};
