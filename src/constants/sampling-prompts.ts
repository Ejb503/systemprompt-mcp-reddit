import { SamplingPrompt } from "../types/sampling.js";
import {
  REDDIT_POST_RESPONSE_SCHEMA,
  REDDIT_REPLY_RESPONSE_SCHEMA,
} from "../types/sampling-schemas.js";

// Add these prompts
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
    {
      name: "kind",
      description: "Type of post (text or link)",
      required: false,
    },
    {
      name: "url",
      description: "URL for link posts",
      required: false,
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
        text: "I understand the subreddit rules and posting guidelines:\n{{redditConfig}}",
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
Post Type: {{kind}}
{{#url}}URL: {{url}}{{/url}}

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
    callback: "create_reddit_post",
    responseSchema: REDDIT_POST_RESPONSE_SCHEMA,
  },
};

export const CREATE_REDDIT_REPLY_PROMPT: SamplingPrompt = {
  name: "reddit_create_reply",
  description: "Creates thoughtful, contextual Reddit replies",
  arguments: [
    {
      name: "subreddit",
      description: "Subreddit context",
      required: true,
    },
    {
      name: "messageId",
      description: "ID of message to reply to",
      required: true,
    },
    {
      name: "content",
      description: "Instructions for generating the reply",
      required: true,
    },
  ],
  messages: [
    {
      role: "assistant",
      content: {
        type: "text",
        text: "You are an expert Reddit commenter who creates thoughtful, well-reasoned replies that add value to discussions. You understand Reddit culture, subreddit dynamics, and how to engage constructively with other users.",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "I understand the subreddit rules and commenting guidelines:\n{{redditConfig}}",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "I will follow these content creation instructions:\n{{redditInstructions}}",
      },
    },
    {
      role: "user",
      content: {
        type: "text",
        text: `Create a Reddit reply with these parameters:

Subreddit: {{subreddit}}
Replying to: {{messageId}}

Content Instructions: {{content}}

Ensure the reply:
- Is relevant and adds value to the discussion
- Shows understanding of the context
- Is well-reasoned and supported
- Uses appropriate tone and style
- Follows subreddit rules and Reddit etiquette
- Encourages further constructive discussion`,
      },
    },
  ],
  _meta: {
    callback: "create_reddit_reply",
    responseSchema: REDDIT_REPLY_RESPONSE_SCHEMA,
  },
};

// Export all prompts
export const PROMPTS = [CREATE_REDDIT_POST_PROMPT, CREATE_REDDIT_REPLY_PROMPT];
