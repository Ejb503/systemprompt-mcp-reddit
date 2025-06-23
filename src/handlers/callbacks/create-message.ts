import type { CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';
import type { JSONSchema7 } from "json-schema";
import { RedditService } from '@reddit/services/reddit/reddit-service';
import { authStore } from '@reddit/server/auth-store';
import { logger } from '@/utils/logger';
import { RedditError } from '@reddit/types/reddit';

import { sendSamplingCompleteNotification } from '../notifications';
import { formatToolResponse } from '../tools/types';


// LLM-generated message content (different from API response)
export interface GeneratedRedditMessage {
  recipient: string;
  subject: string;
  content: string;
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

export async function handleCreateRedditMessageCallback(
  result: CreateMessageResult,
  sessionId: string
): Promise<void> {
  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const messageData = JSON.parse(result.content.text) as GeneratedRedditMessage;

    if (!messageData.recipient || !messageData.subject || !messageData.content) {
      throw new Error(
        "Invalid message data: missing required fields (recipient, subject, or content)",
      );
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

    let messageResponse;
    try {
      // Send the message to Reddit
      messageResponse = await redditService.sendMessage({
        recipient: messageData.recipient,
        subject: messageData.subject,
        content: messageData.content
      });

      logger.info('Successfully sent message to Reddit', {
        messageId: messageResponse.id,
        recipient: messageData.recipient,
        subject: messageData.subject
      });
    } catch (error) {
      logger.error('Failed to send message to Reddit', {
        error: error instanceof Error ? error.message : String(error),
        recipient: messageData.recipient,
        subject: messageData.subject
      });
      
      // Send error notification
      const errorResponse = formatToolResponse({
        status: "error",
        message: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: {
          type: error instanceof RedditError ? error.type : "API_ERROR",
          details: error,
        },
        type: "sampling",
        title: "Error Sending Message",
      });

      await sendSamplingCompleteNotification(JSON.stringify(errorResponse), sessionId);
      return;
    }

    // Send success notification with Reddit response
    const notificationResponse = formatToolResponse({
      message: `Message successfully sent to u/${messageData.recipient}`,
      result: {
        id: messageResponse.id,
        recipient: messageData.recipient,
        subject: messageData.subject,
        content: messageData.content,
        timestamp: new Date().toISOString()
      },
      type: "sampling",
      title: "Message Sent Successfully",
    });

    await sendSamplingCompleteNotification(JSON.stringify(notificationResponse), sessionId);
  } catch (error) {
    logger.error('Error in handleCreateRedditMessageCallback', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    });
    throw error;
  }
}
