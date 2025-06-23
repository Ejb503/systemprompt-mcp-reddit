import { CREATE_REDDIT_POST_PROMPT } from '@reddit/constants/sampling/index';
import { createRedditPostSuccessMessage } from '@reddit/constants/tool/create-post';
import { TOOL_ERROR_MESSAGES } from '@reddit/constants/tools';
import { handleGetPrompt } from '@reddit/handlers/prompt-handlers';
import { sendSamplingRequest } from '@reddit/handlers/sampling';
import { RedditError } from '@reddit/types/reddit';
import { injectVariables } from '@reddit/utils/message-handlers';
import type { JSONSchema7 } from 'json-schema';

import { formatToolResponse } from './types';
import type { ToolHandler, CreateRedditPostArgs } from './types';

const responseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'error'] },
    message: { type: 'string' },
    result: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending'] },
        subreddit: { type: 'string' },
        post: {
          type: 'object',
          properties: {
            subreddit: {
              type: 'string',
              description: 'Subreddit to post to (without r/ prefix)',
            },
            title: {
              type: 'string',
              description: 'Post title (1-300 characters)',
              minLength: 1,
              maxLength: 300,
            },
            content: {
              type: 'string',
              description: 'Text content for the post',
            },
            flair: {
              type: 'object',
              description: 'Flair information for the post',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the selected flair',
                },
                text: {
                  type: 'string',
                  description: 'Text of the selected flair',
                },
              },
              required: ['id', 'text'],
            },
            sendreplies: {
              type: 'boolean',
              description: 'Whether to send replies to inbox',
              default: true,
            },
            nsfw: {
              type: 'boolean',
              description: 'Whether to mark as NSFW',
              default: false,
            },
            spoiler: {
              type: 'boolean',
              description: 'Whether to mark as spoiler',
              default: false,
            },
          },
          required: ['subreddit', 'title', 'content'],
        },
        availableFlairs: {
          type: 'array',
          description: 'List of available flairs for the subreddit',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              type: { type: 'string', enum: ['text', 'richtext', 'image'] },
              textEditable: { type: 'boolean' },
              backgroundColor: { type: 'string' },
              textColor: { type: 'string' },
              modOnly: { type: 'boolean' },
            },
            required: ['id', 'text', 'type'],
          },
        },
      },
      required: ['status', 'subreddit', 'post', 'availableFlairs'],
    },
  },
  required: ['status', 'message', 'result'],
};

export const handleCreateRedditPost: ToolHandler<CreateRedditPostArgs> = async (
  args,
  { redditService, sessionId },
) => {
  try {
    // Fetch subreddit info including flairs
    const subredditInfo = await redditService.getSubredditInfo(args.subreddit);
    const flairs = await redditService.getSubredditFlairs(args.subreddit);

    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: 'post',
      flairRequired: String(subredditInfo.flairRequired || false),
      availableFlairs: JSON.stringify(flairs),
      subredditRules: JSON.stringify(subredditInfo),
      redditConfig: JSON.stringify({
        allowedPostTypes: subredditInfo.allowedPostTypes,
        rules: subredditInfo.rules,
        titleRequirements: subredditInfo.titleRequirements,
        bodyRequirements: subredditInfo.bodyRequirements,
        flairRequired: subredditInfo.flairRequired,
      }),
    };

    const prompt = await handleGetPrompt({
      method: 'prompts/get',
      params: {
        name: CREATE_REDDIT_POST_PROMPT.name,
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
    const progressToken = `create-post-${sessionId}-${Date.now()}`;

    sendSamplingRequest(
      {
        method: 'sampling/createMessage',
        params: {
          messages: CREATE_REDDIT_POST_PROMPT.messages.map((msg) =>
            injectVariables(msg, stringArgs),
          ) as Array<{
            role: 'user' | 'assistant';
            content: { type: 'text'; text: string };
          }>,
          maxTokens: 100000,
          temperature: 0.7,
          _meta: {
            callback: 'create_post_callback',
            responseSchema: promptResponseSchema,
            progressToken,
          },
          arguments: stringArgs,
        },
      },
      { sessionId },
    );

    return formatToolResponse({
      message: createRedditPostSuccessMessage,
      type: 'sampling',
      title: 'Create Reddit Message',
    });
  } catch (error) {
    return formatToolResponse({
      status: 'error',
      message: `Failed to create Reddit post: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof RedditError ? error.type : 'API_ERROR',
        details: error,
      },
      type: 'sampling',
      title: 'Error Creating Post',
    });
  }
};
