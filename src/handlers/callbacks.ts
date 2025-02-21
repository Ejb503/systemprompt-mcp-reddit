import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "../types/systemprompt.js";
import { sendJsonResultNotification, updateBlocks } from "./notifications.js";

interface TextContent {
  type: "text";
  text: string;
}

function isTextContent(content: unknown): content is TextContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    content.type === "text" &&
    "text" in content &&
    typeof content.text === "string"
  );
}

export async function handleCreateRedditPostCallback(result: CreateMessageResult): Promise<string> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const postData = JSON.parse(result.content.text);

    // Create a block to store the post
    const postBlock: SystempromptBlockRequest = {
      content: JSON.stringify(postData),
      type: "block",
      prefix: "reddit_message",
      metadata: {
        title: "Reddit Post",
        description: "Generated Reddit post content",
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(postBlock);

    await sendJsonResultNotification(`Reddit post block created: ${JSON.stringify(savedBlock)}`);
    await updateBlocks();
    return JSON.stringify(savedBlock);
  } catch (error) {
    console.error("Failed to handle Reddit post callback:", error);
    throw error;
  }
}

export async function handleCreateRedditReplyCallback(
  result: CreateMessageResult,
): Promise<string> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const replyData = JSON.parse(result.content.text);

    // Create a block to store the reply
    const replyBlock: SystempromptBlockRequest = {
      content: JSON.stringify(replyData),
      type: "block",
      prefix: "reddit_reply",
      metadata: {
        title: "Reddit Reply",
        description: "Generated Reddit reply content",
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(replyBlock);

    await sendJsonResultNotification(`Reddit reply block created: ${JSON.stringify(savedBlock)}`);
    await updateBlocks();
    return JSON.stringify(savedBlock);
  } catch (error) {
    console.error("Failed to handle Reddit reply callback:", error);
    throw error;
  }
}
