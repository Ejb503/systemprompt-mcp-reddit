import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "./notifications.js";

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

// LLM-generated post content (different from API response)
export interface GeneratedRedditPost {
  title: string;
  content: string;
  subreddit: string;
  tags?: string[];
  [key: string]: unknown;
}

// LLM-generated reply content (different from API response)
export interface GeneratedRedditReply {
  content: string;
  subreddit: string;
  messageId: string;
  [key: string]: unknown;
}

// Interface for suggested action response
export interface GeneratedSuggestAction {
  action: string;
  subreddit?: string;
  reasoning: string;
  content?: string;
  messageId?: string;
  [key: string]: unknown;
}

// Interface for subreddit analysis response
export interface GeneratedSubredditAnalysis {
  subreddit: string;
  summary: string;
  trendingTopics: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  recommendedActions: Array<{
    action: string;
    reason: string;
  }>;
  [key: string]: unknown;
}

export async function handleCreateRedditPostCallback(result: CreateMessageResult): Promise<string> {
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
        title: `Reddit Post for r/${postData.subreddit}`,
        description: `Generated Reddit post content for r/${postData.subreddit}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(postBlock);

    await sendSamplingCompleteNotification(`Reddit post created for r/${postData.subreddit}`);
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

    await sendSamplingCompleteNotification(
      `Reddit reply created for message ${replyData.messageId} in r/${replyData.subreddit}. Please read it to the user`,
    );
    await updateBlocks();
    return JSON.stringify(savedBlock);
  } catch (error) {
    console.error("Failed to handle Reddit reply callback:", error);
    throw error;
  }
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

    await sendSamplingCompleteNotification(
      `Reddit action suggestion created: ${actionData.action}. Please read it to the user`,
    );
    await updateBlocks();
    return JSON.stringify(savedBlock);
  } catch (error) {
    console.error("Failed to handle suggest action callback:", error);
    throw error;
  }
}

export async function handleAnalyseSubredditCallback(result: CreateMessageResult): Promise<string> {
  const systemPromptService = SystemPromptService.getInstance();

  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const analysisData = JSON.parse(result.content.text) as GeneratedSubredditAnalysis;

    if (
      !analysisData.subreddit ||
      !analysisData.summary ||
      !analysisData.trendingTopics ||
      !analysisData.sentiment ||
      !analysisData.recommendedActions
    ) {
      throw new Error("Invalid analysis data: missing required fields");
    }
    // Create a block to store the subreddit analysis
    const analysisBlock: SystempromptBlockRequest = {
      content: JSON.stringify(analysisData),
      type: "block",
      prefix: "reddit_subreddit_analysis",
      metadata: {
        title: `Analysis of r/${analysisData.subreddit}`,
        description: `Generated analysis for r/${analysisData.subreddit}`,
        tag: ["mcp_systemprompt_reddit"],
      },
    };

    // Create new block
    const savedBlock = await systemPromptService.createBlock(analysisBlock);

    await updateBlocks();
    await sendSamplingCompleteNotification(
      `Reddit analysis created for r/${analysisData.subreddit} - ${JSON.stringify(analysisData)}. Please read it to the user`,
    );
    await updateBlocks();
    return JSON.stringify(savedBlock);
  } catch (error) {
    console.error("Failed to handle subreddit analysis callback:", error);
    throw error;
  }
}
