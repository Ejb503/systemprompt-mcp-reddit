import type { CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';
import type { JSONSchema7 } from "json-schema";
import { RedditService } from '@reddit/services/reddit/reddit-service';
import { authStore } from '@reddit/server/auth-store';
import { logger } from '@/utils/logger';
import { RedditError } from '@reddit/types/reddit';

import { sendSamplingCompleteNotification } from '../notifications';
import { formatToolResponse } from '../tools/types';


// LLM-generated post content (different from API response)
export interface GeneratedRedditPost {
  title: string;
  content: string;
  subreddit: string;
  tags?: string[];
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

export async function handleCreateRedditPostCallback(result: CreateMessageResult, sessionId: string): Promise<void> {
  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const postData = JSON.parse(result.content.text) as GeneratedRedditPost;

    if (!postData.title || !postData.content || !postData.subreddit) {
      throw new Error("Invalid post data: missing required fields (title, content, or subreddit)");
    }

    // Get auth info from the auth store
    const authInfo = authStore.getAuth(sessionId);
    if (!authInfo) {
      throw new Error(`Auth info not found for session: ${sessionId}`);
    }

    if (!authInfo.extra?.redditAccessToken || !authInfo.extra?.redditRefreshToken) {
      throw new Error('Reddit authentication tokens not found');
    }

    // Create Reddit service instance
    const redditService = new RedditService({
      accessToken: authInfo.extra.redditAccessToken,
      refreshToken: authInfo.extra.redditRefreshToken,
    });

    let postResponse;
    try {
      // Create the post on Reddit
      postResponse = await redditService.createPost({
        subreddit: postData.subreddit,
        title: postData.title,
        content: postData.content
      });

      logger.info('Successfully created post on Reddit', {
        postId: postResponse.id,
        subreddit: postData.subreddit,
        title: postData.title
      });
    } catch (error) {
      logger.error('Failed to create post on Reddit', {
        error: error instanceof Error ? error.message : String(error),
        subreddit: postData.subreddit,
        title: postData.title
      });
      
      // Send error notification
      const errorResponse = formatToolResponse({
        status: "error",
        message: `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: {
          type: error instanceof RedditError ? error.type : "API_ERROR",
          details: error,
        },
        type: "sampling",
        title: "Error Creating Post",
      });

      await sendSamplingCompleteNotification(JSON.stringify(errorResponse), sessionId);
      return;
    }

    // Send success notification with Reddit response
    const notificationResponse = formatToolResponse({
      message: `Post successfully created in r/${postData.subreddit}`,
      result: {
        id: postResponse.id,
        title: postData.title,
        content: postData.content,
        subreddit: postData.subreddit,
        url: postResponse.url,
        permalink: postResponse.permalink
      },
      type: "sampling",
      title: "Post Created Successfully",
    });

    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse), sessionId);
  } catch (error) {
    logger.error('Error in handleCreateRedditPostCallback', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    });
    throw error;
  }
}
