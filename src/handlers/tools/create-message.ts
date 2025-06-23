import { PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { CREATE_REDDIT_MESSAGE_PROMPT } from '@reddit/constants/sampling/index';
import { createRedditMessageSuccessMessage } from '@reddit/constants/tool/create-message';
import { TOOL_ERROR_MESSAGES } from '@reddit/constants/tools';
import { handleGetPrompt } from '@reddit/handlers/prompt-handlers';
import { sendSamplingRequest } from '@reddit/handlers/sampling';
import { RedditError } from '@reddit/types/reddit';
import { injectVariables } from '@reddit/utils/message-handlers';

import type { JSONSchema7 } from 'json-schema';
import type { ToolHandler } from './types';
import { formatToolResponse } from './types';

const responseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'error'] },
    message: { type: 'string' },
    result: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending'] },
        message: {
          type: 'object',
          properties: {
            recipient: {
              type: 'string',
              description: 'Username of the message recipient',
            },
            subject: {
              type: 'string',
              description: 'Subject line of the message (1-100 chars)',
              minLength: 1,
              maxLength: 100,
            },
            content: {
              type: 'string',
              description: 'Message content in markdown format (max 10000 chars)',
              maxLength: 10000,
            },
          },
          required: ['recipient', 'subject', 'content'],
        },
      },
      required: ['status', 'message'],
    },
  },
  required: ['status', 'message', 'result'],
};

export const handleCreateRedditMessage: ToolHandler<{
  recipient: string;
  subject: string;
  content: string;
}> = async (args, { sessionId }) => {
  try {
    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: 'message',
    };

    const prompt = await handleGetPrompt({
      method: 'prompts/get',
      params: {
        name: CREATE_REDDIT_MESSAGE_PROMPT.name,
        arguments: stringArgs,
      },
    });

    const promptResponseSchema = prompt._meta?.responseSchema;
    if (!promptResponseSchema) {
      throw new Error(`${TOOL_ERROR_MESSAGES.TOOL_CALL_FAILED} No response schema found`);
    }

    if (!sessionId) {
      throw new Error('Session ID is required for sampling requests');
    }

    // Generate a unique progress token for this sampling request
    const progressToken = `create-message-${sessionId}-${Date.now()}`;

    sendSamplingRequest(
      {
        method: 'sampling/createMessage',
        params: {
          messages: CREATE_REDDIT_MESSAGE_PROMPT.messages.map((msg) =>
            injectVariables(msg, stringArgs),
          ) as Array<{
            role: 'user' | 'assistant';
            content: { type: 'text'; text: string };
          }>,
          maxTokens: 100000,
          temperature: 0.7,
          _meta: {
            callback: 'create_message_callback',
            responseSchema: promptResponseSchema,
            progressToken,
          },
          arguments: stringArgs,
        },
      },
      { sessionId },
    );

    return formatToolResponse({
      message: createRedditMessageSuccessMessage,
      result: {
        status: 'pending',
        message: createRedditMessageSuccessMessage,
      },
      type: 'sampling',
      title: 'Create Reddit Message',
    });
  } catch (error) {
    return formatToolResponse({
      status: 'error',
      message: `Failed to create Reddit message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof RedditError ? error.type : 'API_ERROR',
        details: error,
      },
      type: 'sampling',
      title: 'Error Creating Message',
    });
  }
};
