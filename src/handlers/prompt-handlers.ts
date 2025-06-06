import {
  ListPromptsRequest,
  ListPromptsResult,
  GetPromptRequest,
  GetPromptResult,
  PromptMessage,
} from "@modelcontextprotocol/sdk/types.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { PROMPTS } from "@/constants/sampling/index.js";

export async function handleListPrompts(
  request: ListPromptsRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<ListPromptsResult> {
  return { prompts: PROMPTS };
}

export async function handleGetPrompt(
  request: GetPromptRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<GetPromptResult> {
  const prompt = PROMPTS.find((p: any) => p.name === request.params.name);
  if (!prompt) {
    throw new Error(`Prompt not found: ${request.params.name}`);
  }

  // Replace variables in the prompt messages
  const messages = prompt.messages.map((message: PromptMessage) => {
    if (message.content.type !== "text") {
      return message; // Return non-text content as-is
    }

    let text = String(message.content.text);

    // Replace variables with provided arguments
    if (request.params.arguments) {
      Object.entries(request.params.arguments).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        text = text.replace(new RegExp(placeholder, "g"), String(value));
      });
    }

    return {
      role: message.role,
      content: {
        type: "text" as const,
        text: text,
      },
    };
  });

  return {
    description: prompt.description,
    messages: messages,
    _meta: prompt._meta,
  };
}
