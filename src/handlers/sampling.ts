import type { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { validateRequest } from "../utils/validation.js";
import { server } from "../server.js";
import { sendOperationNotification } from "./notifications.js";
import {
  handleCreateRedditPostCallback,
  handleCreateRedditCommentCallback,
  handleSuggestActionCallback,
  handleAnalyseSubredditCallback,
} from "./callbacks.js";
import { handleCreateRedditMessageCallback } from "./callbacks/create-message.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export async function sendSamplingRequest(
  request: CreateMessageRequest,
  extra?: { authInfo?: AuthInfo },
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
async function handleCallback(callback: string, result: CreateMessageResult): Promise<void> {
  try {
    await sendOperationNotification(callback, `Callback started: ${callback}`);
    switch (callback) {
      case "create_post_callback":
        await handleCreateRedditPostCallback(result);
        break;
      case "create_comment_callback":
        await handleCreateRedditCommentCallback(result);
        break;
      case "suggest_action":
        await handleSuggestActionCallback(result);
        break;
      case "analyse_subreddit_callback":
        await handleAnalyseSubredditCallback(result);
        break;
      case "create_message_callback":
        await handleCreateRedditMessageCallback(result);
        break;
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
