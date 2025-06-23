import { ANALYSE_SUBREDDIT_PROMPT } from '@reddit/constants/sampling/analyse-subreddit';
import { TOOL_ERROR_MESSAGES } from '@reddit/constants/tools';
import { handleGetPrompt } from '@reddit/handlers/prompt-handlers';
import { sendSamplingRequest } from '@reddit/handlers/sampling';
import { RedditError } from '@reddit/types/reddit';
import { injectVariables } from '@reddit/utils/message-handlers';
import type { JSONSchema7 } from 'json-schema';
import { logger } from '@/utils/logger';

import { formatToolResponse } from './types';
import type { ToolHandler, AnalyseSubredditArgs } from './types';

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
      },
      required: ['status', 'subreddit'],
    },
  },
  required: ['status', 'message', 'result'],
};

export const handleAnalyseSubreddit: ToolHandler<AnalyseSubredditArgs> = async (
  args,
  { redditService, userId, sessionId },
) => {
  logger.info('ENTERED handleAnalyseSubreddit function', {
    subreddit: args.subreddit,
    userId,
    sessionId,
    hasRedditService: !!redditService,
    redditServiceType: typeof redditService,
    redditServiceConstructor: redditService?.constructor?.name,
  });

  try {
    logger.info('Starting subreddit analysis', {
      subreddit: args.subreddit,
      userId,
      redditServiceInitialized: (redditService as any).initialized,
    });

    logger.info('Fetching hot posts', { subreddit: args.subreddit });
    const hotPosts = await redditService.fetchPosts({
      sort: 'hot',
      subreddit: args.subreddit,
      limit: 10,
    });
    logger.info('Hot posts fetched successfully', { count: hotPosts.length });

    const newPosts = await redditService.fetchPosts({
      sort: 'new',
      subreddit: args.subreddit,
      limit: 10,
    });

    const controversialPosts = await redditService.fetchPosts({
      sort: 'controversial',
      subreddit: args.subreddit,
      limit: 10,
    });

    const stringArgs = {
      subreddit: args.subreddit,
      hotPosts: JSON.stringify(hotPosts),
      newPosts: JSON.stringify(newPosts),
      controversialPosts: JSON.stringify(controversialPosts),
    };

    const prompt = await handleGetPrompt({
      method: 'prompts/get',
      params: {
        name: ANALYSE_SUBREDDIT_PROMPT.name,
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
    // The sampling server will use this token to send progress updates back to us
    const progressToken = `analyse-subreddit-${sessionId}-${Date.now()}`;

    sendSamplingRequest(
      {
        method: 'sampling/createMessage',
        params: {
          messages: ANALYSE_SUBREDDIT_PROMPT.messages.map((msg) =>
            injectVariables(msg, stringArgs),
          ) as Array<{
            role: 'user' | 'assistant';
            content: { type: 'text'; text: string };
          }>,
          maxTokens: 100000,
          temperature: 0.7,
          _meta: {
            callback: 'analyse_subreddit_callback',
            responseSchema: promptResponseSchema,
            progressToken, // Our token for receiving progress updates
          },
          arguments: stringArgs,
        },
      },
      { sessionId },
    );

    return formatToolResponse({
      message: `Reddit subreddit analysis started for r/${args.subreddit}, please wait...`,
      result: {
        status: 'pending',
        subreddit: args.subreddit,
      },
      schema: responseSchema,
      type: 'sampling',
      title: 'Subreddit Analysis',
    });
  } catch (error) {
    logger.error('Subreddit analysis failed', {
      subreddit: args.subreddit,
      userId,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      redditServiceInitialized: (redditService as any).initialized,
    });

    return formatToolResponse({
      status: 'error',
      message: `Failed to analyze subreddit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof RedditError ? error.type : 'API_ERROR',
        details: error,
      },
      type: 'sampling',
      title: 'Error Analyzing Subreddit',
    });
  }
};
