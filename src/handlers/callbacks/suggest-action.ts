import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

// Interface for suggested action response
export interface GeneratedSuggestAction {
  action: string;
  subreddit?: string;
  reasoning: string;
  content?: string;
  id?: string;
  [key: string]: unknown;
}

const blockSchema: JSONSchema7 = {
  type: "object",
  properties: {
    id: { type: "string" },
    content: { type: "string" },
    type: { type: "string" },
    prefix: { type: "string" },
    metadata: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        tag: { type: "array", items: { type: "string" } },
      },
      required: ["title", "description", "tag"],
    },
  },
  required: ["id", "content", "type", "prefix", "metadata"],
};

function isTextContent(content: unknown): content is { type: "text"; text: string } {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    content.type === "text" &&
    "text" in content &&
    typeof content.text === "string"
  );
}

export async function handleSuggestActionCallback(result: CreateMessageResult): Promise<string> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const actionData = JSON.parse(result.content.text) as GeneratedSuggestAction;

    if (!actionData.action || !actionData.reasoning) {
      throw new Error("Invalid action data: missing required fields (action or reasoning)");
    }

    // Create a block to store the suggested action
    const actionBlock: SystempromptBlockRequest = {
      content: JSON.stringify(actionData),
      type: "block",
      prefix: "reddit_suggested_action",
      metadata: {
        title: `Suggested Reddit Action: ${actionData.action}`,
        description: `Generated action suggestion for Reddit`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(actionBlock);

    const notificationResponse = await sendSamplingCompleteNotification(
      `Reddit action suggestion created: ${actionData.action}. Please read it to the user`,
    );
    await updateBlocks();

    return JSON.stringify(
      formatToolResponse({
        message: `Reddit action suggestion created: ${actionData.action}`,
        result: savedBlock,
        schema: blockSchema,
        type: "sampling",
        title: "Suggest Action Callback",
      }),
    );
  } catch (error) {
    throw error;
  }
}
