import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

// LLM-generated reply content (different from API response)
export interface GeneratedRedditReply {
  content: string;
  subreddit: string;
  messageId: string;
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

export async function handleCreateRedditReplyCallback(
  result: CreateMessageResult,
): Promise<string> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const replyData = JSON.parse(result.content.text) as GeneratedRedditReply;

    if (!replyData.content || !replyData.subreddit || !replyData.messageId) {
      throw new Error(
        "Invalid reply data: missing required fields (content, subreddit, or messageId)",
      );
    }

    // Create a block to store the reply
    const replyBlock: SystempromptBlockRequest = {
      content: JSON.stringify(replyData),
      type: "block",
      prefix: "reddit_reply",
      metadata: {
        title: `Reddit Reply in r/${replyData.subreddit}`,
        description: `Generated Reddit reply content for message ${replyData.messageId} in r/${replyData.subreddit}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(replyBlock);

    const notificationResponse = await sendSamplingCompleteNotification(
      `Reddit reply created for message ${replyData.messageId} in r/${replyData.subreddit}. Please read it to the user`,
    );
    await updateBlocks();

    return JSON.stringify(
      formatToolResponse({
        message: `Reddit reply created for message ${replyData.messageId} in r/${replyData.subreddit}`,
        result: savedBlock,
        schema: blockSchema,
        type: "sampling",
        title: "Create Reddit Reply Callback",
      }),
    );
  } catch (error) {
    console.error("Failed to handle Reddit reply callback:", error);
    throw error;
  }
}
