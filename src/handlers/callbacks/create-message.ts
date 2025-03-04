import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

// LLM-generated message content (different from API response)
export interface GeneratedRedditMessage {
  recipient: string;
  subject: string;
  content: string;
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

export async function handleCreateRedditMessageCallback(
  result: CreateMessageResult,
): Promise<void> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const messageData = JSON.parse(result.content.text) as GeneratedRedditMessage;

    if (!messageData.recipient || !messageData.subject || !messageData.content) {
      throw new Error(
        "Invalid message data: missing required fields (recipient, subject, or content)",
      );
    }

    // Create a block to store the message
    const messageBlock: SystempromptBlockRequest = {
      content: JSON.stringify(messageData),
      type: "block",
      prefix: "reddit_message",
      metadata: {
        title: `Message to u/${messageData.recipient}`,
        description: `Generated Reddit message to u/${messageData.recipient}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(messageBlock);
    const message = `Reddit message created for u/${messageData.recipient}. Please read it to the user`;

    const notificationResponse = formatToolResponse({
      message: message,
      result: savedBlock,
      schema: blockSchema,
      type: "sampling",
      title: "Create Reddit Message Callback",
    });
    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse));
    await updateBlocks();
  } catch (error) {
    throw error;
  }
}
