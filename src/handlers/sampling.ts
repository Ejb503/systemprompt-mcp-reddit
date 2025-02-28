import type { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { validateRequest } from "../utils/validation.js";
import { server } from "../server.js";
import { sendOperationNotification } from "./notifications.js";
import {
  handleCreateRedditPostCallback,
  handleCreateRedditReplyCallback,
  handleSuggestActionCallback,
  handleAnalyseSubredditCallback,
} from "./callbacks.js";

export async function sendSamplingRequest(
  request: CreateMessageRequest,
): Promise<CreateMessageResult> {
  try {
    validateRequest(request);
    const result = await server.createMessage(request.params);

    const callback = request.params._meta?.callback;
    if (callback && typeof callback === "string") {
      await handleCallback(callback, result);
    }
    return result;
  } catch (error) {
    console.error("Sampling request failed:", error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to process sampling request: ${error || "Unknown error"}`);
  }
}

/**
 * Handles a callback based on its type
 * @param callback The callback type
 * @param result The LLM result
 * @returns The tool response
 */
async function handleCallback(callback: string, result: CreateMessageResult): Promise<string> {
  try {
    await sendOperationNotification(callback, `Callback started: ${callback}`);
    switch (callback) {
      case "create_reddit_post":
        return await handleCreateRedditPostCallback(result);
      case "create_reddit_reply":
        return await handleCreateRedditReplyCallback(result);
      case "suggest_action":
        return await handleSuggestActionCallback(result);
      case "analyse_subreddit_callback":
        return await handleAnalyseSubredditCallback(result);
      default:
        throw new Error(`Unknown callback type: ${callback}`);
    }
  } catch (error) {
    await sendOperationNotification(
      callback,
      `Callback failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}
