import { SamplingPrompt } from "@/types/sampling.js";
import { REDDIT_MESSAGE_RESPONSE_SCHEMA } from "@/types/sampling-schemas.js";

export const CREATE_REDDIT_MESSAGE_PROMPT: SamplingPrompt = {
  name: "reddit_create_message",
  description: "Creates thoughtful, well-structured Reddit messages",
  arguments: [
    {
      name: "recipient",
      description: "Username of the message recipient",
      required: true,
    },
    {
      name: "subject",
      description: "Subject line for the message (1-100 chars)",
      required: true,
    },
    {
      name: "content",
      description: "Instructions for generating the message content",
      required: true,
    },
  ],
  messages: [
    {
      role: "assistant",
      content: {
        type: "text",
        text: "You are an expert Reddit communicator who creates thoughtful, well-structured messages that effectively convey information and maintain professional etiquette. You understand Reddit's messaging culture and how to engage respectfully with other users.",
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
        text: `Create a Reddit message with these parameters:

Recipient: u/{{recipient}}
Subject: {{subject}}

Content Instructions: {{content}}

Ensure the message:
- Is clear and well-structured
- Uses appropriate tone and formality
- Is concise but complete
- Follows Reddit messaging etiquette
- Avoids spam-like behavior
- Encourages constructive communication`,
      },
    },
  ],
  _meta: {
    callback: "create_message_callback",
    responseSchema: REDDIT_MESSAGE_RESPONSE_SCHEMA,
  },
};
