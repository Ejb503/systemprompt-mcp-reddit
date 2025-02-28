import { sendJsonResultNotification } from "../notifications.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { ConfigureInstructionsArgs } from "@/types/tool-schemas.js";
import { ToolHandler } from "./types.js";

export const handleConfigureInstructions: ToolHandler<ConfigureInstructionsArgs> = async (
  args,
  { systemPromptService },
) => {
  try {
    const instructionBlock: SystempromptBlockRequest = {
      content: JSON.stringify(args),
      type: "block",
      prefix: "reddit_instructions",
      metadata: {
        title: "Reddit Instructions",
        description: "Content creation guidelines for Reddit",
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    const result = await systemPromptService.upsertBlock(instructionBlock);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              message: "Reddit instructions saved successfully",
              config: result,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error("Failed to save Reddit instructions:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to save Reddit instructions: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
};
