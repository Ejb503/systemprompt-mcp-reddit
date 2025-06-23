import { CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { sendSamplingCompleteNotification } from "../notifications";
import { formatToolResponse } from "../tools/types";

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
  [key: string]: any;
}

function isTextContent(content: any): content is { type: "text"; text: string } {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    content.type === "text" &&
    "text" in content &&
    typeof content.text === "string"
  );
}

export async function handleAnalyseSubredditCallback(
  result: CreateMessageResult,
  sessionId: string,
): Promise<void> {
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

    const message = `Reddit analysis generated for r/${analysisData.subreddit}`;

    const notificationResponse = formatToolResponse({
      message: message,
      result: analysisData,
      type: "sampling",
      title: "Analyse Subreddit Callback",
    });
    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse), sessionId);
  } catch (error) {
    throw error;
  }
}
