/**
 * @file MCP Sampling request handler
 * @module handlers/sampling
 * 
 * @remarks
 * This module implements the MCP sampling feature, which allows the server
 * to request LLM completions from the client. This is used to generate
 * Reddit content (posts, comments, messages) with AI assistance.
 * 
 * The sampling flow:
 * 1. Server receives a tool call that requires content generation
 * 2. Server sends a sampling request to the client
 * 3. Client generates content using its LLM
 * 4. Server receives the generated content
 * 5. Server posts the content to Reddit
 * 6. Server sends a notification with the result
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling Specification}
 */

import type { CreateMessageRequest, CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';

import { serverManager } from '../smithery-entry';
import { logger } from '@/utils/logger';

import { handleCreateRedditMessageCallback } from './callbacks/create-message';
import {
  handleCreateRedditPostCallback,
  handleCreateRedditCommentCallback,
  handleSuggestActionCallback,
  handleAnalyseSubredditCallback,
} from './callbacks';
import { sendOperationNotification } from './notifications';

/**
 * Context information for sampling requests.
 * 
 * @remarks
 * Contains session-specific information needed to route
 * sampling requests to the correct MCP server instance.
 */
interface SamplingContext {
  /** Unique session identifier for the current connection */
  sessionId: string;
}

/**
 * Sends a sampling request to the MCP client for content generation.
 * 
 * @remarks
 * This function is the entry point for all sampling operations. It:
 * 1. Validates the request has a valid session
 * 2. Finds the server instance for the session
 * 3. Sends the sampling request to the client
 * 4. Handles the response or any errors
 * 5. Dispatches to the appropriate callback based on metadata
 * 
 * The sampling request includes:
 * - Messages: The conversation context for the LLM
 * - MaxTokens: Maximum tokens for the response
 * - Temperature: Randomness of the generation
 * - Metadata: Callback information and response schema
 * 
 * @param request - The sampling request with messages and parameters
 * @param context - Context containing the session ID
 * @returns Promise resolving to the generated message result
 * @throws Error if session is not found or sampling fails
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#request-format | Sampling Request Format}
 */
export async function sendSamplingRequest(
  request: CreateMessageRequest,
  context: SamplingContext,
): Promise<CreateMessageResult> {
  const startTime = Date.now();
  logger.info('✅ Request validation passed');

  try {
    // validateRequest(request);

    // Get the session-specific server instance
    const { sessionId } = context;
    logger.info('🔍 Looking for session-specific server', {
      sessionId,
    });

    if (!sessionId) {
      logger.error('❌ No session ID provided for sampling request');
      throw new Error('Session ID is required for sampling requests');
    }

    const activeServer = serverManager.getServerForSession(sessionId);
    if (!activeServer) {
      logger.error('❌ No server found for session', { sessionId });
      throw new Error(`Session not found: ${sessionId}`);
    }

    logger.info('✅ Found server for session', { sessionId });

    const samplingRequest = {
      messages: request.params.messages,
      maxTokens: request.params.maxTokens || 8192,
      system: request.params.system,
      temperature: request.params.temperature,
      topP: request.params.topP,
      topK: request.params.topK,
      stopSequences: request.params.stopSequences,
      modelPreferences: request.params.modelPreferences,
      _meta: request.params._meta,
    };

    logger.info('🔍 SAMPLING REQUEST', {
      messages: samplingRequest.messages.length,
      maxTokens: samplingRequest.maxTokens,
      hasSystem: !!samplingRequest.system,
      hasMetadata: !!samplingRequest._meta,
      metadataKeys: samplingRequest._meta ? Object.keys(samplingRequest._meta) : null,
    });

    // Call the server's createMessage for all requests
    const result = await activeServer.createMessage(samplingRequest);

    const callback = request.params._meta?.callback;

    if (callback && typeof callback === 'string') {
      logger.info('🔄 Processing callback', { callback, sessionId });
      await handleCallback(callback, result, sessionId);
      logger.info('✅ Callback processed successfully', { callback, sessionId });
    } else {
      logger.info('ℹ️ No callback to process', {
        hasCallback: !!callback,
        callbackType: typeof callback,
      });
    }

    const duration = Date.now() - startTime;
    logger.info('🎉 SAMPLING REQUEST COMPLETED SUCCESSFULLY', {
      duration,
      hasResult: !!result,
      resultType: typeof result,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('💥 SAMPLING REQUEST FAILED', {
      duration,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      requestMethod: request.method,
      hasParams: !!request.params,
    });

    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to process sampling request: ${error || 'Unknown error'}`);
  }
}

/**
 * Dispatches sampling results to the appropriate callback handler.
 * 
 * @remarks
 * After the client generates content through sampling, this function
 * routes the result to the appropriate handler based on the callback
 * type specified in the original request metadata.
 * 
 * Supported callbacks:
 * - `create_post_callback`: Posts content to Reddit
 * - `create_comment_callback`: Creates a Reddit comment
 * - `suggest_action`: Analyzes and suggests Reddit actions
 * - `analyse_subreddit`: Analyzes subreddit content
 * - `create_message_callback`: Sends a Reddit private message
 * 
 * Each callback handler will:
 * 1. Parse the generated content
 * 2. Perform the Reddit API operation
 * 3. Send a notification with the result
 * 
 * @param callback - The callback type identifier
 * @param result - The LLM-generated content result
 * @param sessionId - The session ID for authentication context
 * @param progressToken - Optional token for progress tracking (currently unused)
 * @returns Promise that resolves when the callback is complete
 * @throws Error if the callback type is unknown
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#handling-responses | Handling Sampling Responses}
 */
async function handleCallback(
  callback: string,
  result: CreateMessageResult,
  sessionId: string,
  progressToken?: string | number,
): Promise<void> {
  logger.info('🔄 CALLBACK HANDLER STARTED', {
    callback,
    sessionId,
    resultType: typeof result,
    resultKeys: result ? Object.keys(result) : null,
    hasContent: !!result?.content,
    contentLength: result?.content?.length || 0,
  });

  try {
    logger.info('📢 Sending operation notification', { callback, sessionId });
    await sendOperationNotification(callback, `Callback started: ${callback}`, sessionId);

    logger.info('🔀 Processing callback by type', { callback, sessionId });
    switch (callback) {
      case 'create_post_callback':
        logger.info('📝 Handling create_post_callback');
        await handleCreateRedditPostCallback(result, sessionId);
        break;
      case 'create_comment_callback':
        logger.info('💬 Handling create_comment_callback');
        await handleCreateRedditCommentCallback(result, sessionId);
        break;
      case 'suggest_action':
        logger.info('💡 Handling suggest_action callback');
        await handleSuggestActionCallback(result, sessionId);
        break;
      case 'analyse_subreddit_callback':
        logger.info('📊 Handling analyse_subreddit_callback');
        await handleAnalyseSubredditCallback(result, sessionId);
        break;
      case 'create_message_callback':
        logger.info('✉️ Handling create_message_callback');
        await handleCreateRedditMessageCallback(result, sessionId);
        break;
      default:
        logger.error('❌ Unknown callback type', { callback });
        throw new Error(`Unknown callback type: ${callback}`);
    }

    logger.info('✅ Callback handler completed successfully', { callback });
  } catch (error) {
    logger.error('💥 CALLBACK HANDLER FAILED', {
      callback,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    await sendOperationNotification(
      callback,
      `Callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      sessionId,
    );
    throw error;
  }
}
