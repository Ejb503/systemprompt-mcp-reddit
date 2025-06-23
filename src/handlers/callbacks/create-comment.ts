import type { CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';
import { RedditService } from '@reddit/services/reddit/reddit-service';
import { authStore } from '@reddit/server/auth-store';
import { logger } from '@/utils/logger';
import { RedditError } from '@reddit/types/reddit';

import { sendSamplingCompleteNotification } from '../notifications';
import { formatToolResponse } from '../tools/types';

// LLM-generated comment content (different from API response)
export interface GeneratedRedditComment {
  content: string;
  id: string;
  subreddit: string;
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

export async function handleCreateRedditCommentCallback(
  result: CreateMessageResult,
  sessionId: string,
): Promise<void> {
  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const commentData = JSON.parse(result.content.text) as GeneratedRedditComment;

    if (!commentData.content || !commentData.id || !commentData.subreddit) {
      throw new Error("Invalid comment data: missing required fields (content, id, or subreddit)");
    }

    // Get auth info from the auth store
    const authInfo = authStore.getAuth(sessionId);
    if (!authInfo) {
      throw new Error(`Auth info not found for session: ${sessionId}`);
    }

    if (!authInfo.extra?.redditAccessToken || !authInfo.extra?.redditRefreshToken) {
      throw new Error("Reddit authentication tokens not found");
    }

    // Create Reddit service instance
    const redditService = new RedditService({
      accessToken: authInfo.extra.redditAccessToken,
      refreshToken: authInfo.extra.redditRefreshToken,
    });

    let commentResponse;
    try {
      // Post the comment to Reddit
      commentResponse = await redditService.sendComment({
        id: commentData.id,
        text: commentData.content,
        sendreplies: true,
      });

      logger.info("Successfully posted comment to Reddit", {
        commentId: commentResponse.id,
        parentId: commentData.id,
        subreddit: commentData.subreddit,
      });
    } catch (error) {
      logger.error("Failed to post comment to Reddit", {
        error: error instanceof Error ? error.message : String(error),
        parentId: commentData.id,
        subreddit: commentData.subreddit,
      });

      // Send error notification
      const errorResponse = formatToolResponse({
        status: "error",
        message: `Failed to post comment: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: {
          type: error instanceof RedditError ? error.type : "API_ERROR",
          details: error,
        },
        type: "sampling",
        title: "Error Posting Comment",
      });

      await sendSamplingCompleteNotification(JSON.stringify(errorResponse), sessionId);
      return;
    }

    // Send success notification with Reddit response
    const notificationResponse = formatToolResponse({
      message: `Comment successfully posted to r/${commentData.subreddit}`,
      result: {
        id: commentResponse.id,
        content: commentResponse.text || commentData.content,
        permalink: commentResponse.permalink,
        parentId: commentData.id,
        subreddit: commentData.subreddit,
      },
      type: "sampling",
      title: "Comment Posted Successfully",
    });

    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse), sessionId);
  } catch (error) {
    logger.error("Error in handleCreateRedditCommentCallback", {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}
