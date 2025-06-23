import type { CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';
import type { JSONSchema7 } from "json-schema";

import { sendSamplingCompleteNotification } from '../notifications';
import { formatToolResponse } from '../tools/types';


// Interface for suggested action response
export interface GeneratedSuggestAction {
  action: string;
  subreddit?: string;
  reasoning: string;
  content?: string;
  id?: string;
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

export async function handleSuggestActionCallback(result: CreateMessageResult, sessionId: string): Promise<string> {
  try {
    if (!isTextContent(result.content)) {
      throw new Error("Invalid content format received from LLM");
    }

    const actionData = JSON.parse(result.content.text) as GeneratedSuggestAction;

    if (!actionData.action || !actionData.reasoning) {
      throw new Error("Invalid action data: missing required fields (action or reasoning)");
    }

    const message = `Reddit action suggestion generated: ${actionData.action}`;

    const notificationResponse = await sendSamplingCompleteNotification(message, sessionId);

    return JSON.stringify(
      formatToolResponse({
        message: message,
        result: actionData,
        type: "sampling",
        title: "Suggest Action Callback",
      }),
    );
  } catch (error) {
    throw error;
  }
}
