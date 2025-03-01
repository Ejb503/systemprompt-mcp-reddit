import { SamplingPrompt } from "@/types/sampling.js";
import { REDDIT_REPLY_RESPONSE_SCHEMA } from "@/types/sampling-schemas.js";

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
    callback: "create_reply_callback",
    responseSchema: REDDIT_REPLY_RESPONSE_SCHEMA,
  },
};
