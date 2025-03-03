import { ToolHandler, DeleteContentArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";

export const handleDeleteContent: ToolHandler<DeleteContentArgs> = async (
  args,
  { systemPromptService },
) => {
  try {
    await systemPromptService.deleteBlock(args.id);
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
