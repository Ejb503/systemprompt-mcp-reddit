import { ToolHandler, DeleteContentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";

export const handleDeleteContent: ToolHandler<DeleteContentArgs> = async (
  args,
  { systemPromptService },
) => {
  try {
    await systemPromptService.deleteBlock(args.resourceId);
    return formatToolResponse({
      message: `Successfully deleted content for ${args.resourceId}`,
      type: "api",
      title: "Delete Content",
    });
  } catch (error) {
    throw new RedditError(
      `Failed to delete content for ${args.resourceId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR",
    );
  }
};
