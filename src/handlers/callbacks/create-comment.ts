import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

// LLM-generated comment content (different from API response)
export interface GeneratedRedditComment {
  content: string;
  id: string;
  subreddit: string;
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

export async function handleCreateRedditCommentCallback(
  result: CreateMessageResult,
): Promise<void> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const commentData = JSON.parse(result.content.text) as GeneratedRedditComment;

    if (!commentData.content || !commentData.id || !commentData.subreddit) {
      throw new Error("Invalid comment data: missing required fields (content, id, or subreddit)");
    }

    const commentBlock: SystempromptBlockRequest = {
      content: JSON.stringify(commentData),
      type: "block",
      prefix: "reddit_comment",
      metadata: {
        title: `Reddit Comment in r/${commentData.subreddit}`,
        description: `Generated Reddit comment content for parent ${commentData.id} in r/${commentData.subreddit}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    const savedBlock = await systemPromptService.createBlock(commentBlock);
    const message = `Reddit comment created for parent ${commentData.id} in r/${commentData.subreddit}. Please read it to the user`;

    const notificationResponse = formatToolResponse({
      message: message,
      result: savedBlock,
      schema: blockSchema,
      type: "sampling",
      title: "Create Reddit Comment Callback",
    });

    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse));
    await updateBlocks();
  } catch (error) {
    throw error;
  }
}
