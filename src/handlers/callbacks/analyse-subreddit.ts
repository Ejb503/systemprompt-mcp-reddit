import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { SystemPromptService } from "../../services/systemprompt-service.js";
import { SystempromptBlockRequest } from "@/types/systemprompt.js";
import { sendSamplingCompleteNotification, updateBlocks } from "../notifications.js";
import { formatToolResponse } from "../tools/types.js";
import { JSONSchema7 } from "json-schema";

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

    const notificationResponse = await sendSamplingCompleteNotification(
      `Reddit analysis created for r/${analysisData.subreddit} - ${JSON.stringify(analysisData)}. Please read it to the user`,
    );
    await updateBlocks();

    return JSON.stringify(
      formatToolResponse({
        message: `Reddit analysis created for r/${analysisData.subreddit}`,
        result: savedBlock,
        schema: blockSchema,
        type: "sampling",
        title: "Analyse Subreddit Callback",
      }),
    );
  } catch (error) {
    console.error("Failed to handle subreddit analysis callback:", error);
    throw error;
  }
}
