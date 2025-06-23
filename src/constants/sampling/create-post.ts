/**
 * @file Sampling prompt for creating Reddit posts
 * @module constants/sampling/create-post
 * 
 * @remarks
 * This module defines the MCP sampling prompt used to generate Reddit posts
 * with AI assistance. The prompt ensures posts are high-quality, follow
 * subreddit rules, and engage the community effectively.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling}
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#prompt-messages | Prompt Messages}
 */

import { REDDIT_POST_RESPONSE_SCHEMA } from '@reddit/types/sampling-schemas';
import type { SamplingPrompt } from '@reddit/types/sampling';

/**
 * Sampling prompt for AI-assisted Reddit post creation.
 * 
 * @remarks
 * This prompt instructs the LLM to create engaging Reddit posts that:
 * - Follow subreddit-specific rules and guidelines
 * - Maintain authenticity and Reddit culture awareness
 * - Generate meaningful discussions
 * - Use appropriate formatting and structure
 * 
 * The prompt uses template variables ({{variable}}) that are replaced
 * with actual values at runtime:
 * - `{{subredditRules}}`: Specific rules for the target subreddit
 * - `{{redditInstructions}}`: User's custom content creation instructions
 * - `{{subreddit}}`: The target subreddit name
 * - `{{content}}`: Specific instructions for this post
 * 
 * @example
 * When invoked, this prompt might generate:
 * ```json
 * {
 *   "title": "[Discussion] What are your favorite TypeScript features?",
 *   "content": "I've been using TypeScript for a few years now...",
 *   "subreddit": "typescript",
 *   "flair_text": "Discussion"
 * }
 * ```
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#structured-output | Structured Output}
 */
export const CREATE_REDDIT_POST_PROMPT: SamplingPrompt = {
  name: "reddit_create_post",
  description: "Creates high-quality, engaging content for a Reddit post",
  arguments: [
    {
      name: "subreddit",
      description: "Subreddit to post to",
      required: true,
    },
    {
      name: "content",
      description: "Instructions for generating the post",
      required: true,
    },
  ],
  messages: [
    {
      role: "assistant",
      content: {
        type: "text",
        text: "You are an expert Reddit content creator who deeply understands Reddit culture, subreddit-specific norms, and how to create engaging, valuable content. Your posts are well-researched, thoughtfully crafted, and designed to spark meaningful discussions.",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "I understand the subreddit rules and posting guidelines:\n{{subredditRules}}",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "I must follow these content creation instructions:\n{{redditInstructions}}",
      },
    },
    {
      role: "user",
      content: {
        type: "text",
        text: `Create a Reddit post following these parameters:
        
Subreddit: {{subreddit}}
Content Instructions: {{content}}

Ensure the post:
- Follows all subreddit rules and guidelines
- Is engaging and promotes meaningful discussion
- Uses appropriate formatting and structure
- Maintains authenticity and adds value to the community
- Has an attention-grabbing but accurate title
- Includes necessary context and details`,
      },
    },
  ],
  _meta: {
    callback: "create_post_callback",
    responseSchema: REDDIT_POST_RESPONSE_SCHEMA,
  },
};
