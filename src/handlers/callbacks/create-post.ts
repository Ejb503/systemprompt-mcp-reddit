import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

// LLM-generated post content (different from API response)
export interface GeneratedRedditPost {
  title: string;
  content: string;
  subreddit: string;
  tags?: string[];
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

export async function handleCreateRedditPostCallback(result: CreateMessageResult): Promise<void> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const postData = JSON.parse(result.content.text) as GeneratedRedditPost;

    if (!postData.title || !postData.content || !postData.subreddit) {
      throw new Error("Invalid post data: missing required fields (title, content, or subreddit)");
    }

    // Create a block to store the post
    const postBlock: SystempromptBlockRequest = {
      content: JSON.stringify(postData),
      type: "block",
      prefix: "reddit_post",
      metadata: {
        title: postData.title,
        description: `Generated Reddit post content for r/${postData.subreddit}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(postBlock);
    const message = `Reddit post created for r/${postData.subreddit}. Please read it to the user`;

    const notificationResponse = formatToolResponse({
      message: message,
      result: savedBlock,
      schema: blockSchema,
      type: "sampling",
      title: "Create Reddit Post Callback",
    });
    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse));
    await updateBlocks();
  } catch (error) {
    throw error;
  }
}
