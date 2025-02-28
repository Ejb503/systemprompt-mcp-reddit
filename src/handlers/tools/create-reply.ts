import { ToolHandler, CreateRedditReplyArgs } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { CREATE_REDDIT_REPLY_PROMPT } from "@/constants/sampling/index.js";

export const handleCreateRedditReply: ToolHandler<CreateRedditReplyArgs> = async (
  args,
  { systemPromptService },
) => {
  // Fetch configurations
  const configBlocks = await systemPromptService.listBlocks();
  const redditConfigBlock = configBlocks.find((block) => block.prefix === "reddit_config");
  const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

  if (!redditConfigBlock || !instructionsBlock) {
    throw new RedditError("Reddit configuration or instructions not found", "VALIDATION_ERROR");
  }

  // Convert all values to strings and include configs
  const stringArgs = {
    ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
    type: "reply", // Explicitly set the type for the prompt
    redditConfig: redditConfigBlock.content,
    redditInstructions: instructionsBlock.content,
  };

  const prompt = await handleGetPrompt({
    method: "prompts/get",
    params: {
      name: CREATE_REDDIT_REPLY_PROMPT.name,
      arguments: stringArgs,
    },
  });

  const responseSchema = prompt._meta?.responseSchema;
  if (!responseSchema) {
    throw new Error(`${TOOL_ERROR_MESSAGES.TOOL_CALL_FAILED} No response schema found`);
  }

  await sendSamplingRequest({
    method: "sampling/createMessage",
    params: {
      messages: CREATE_REDDIT_REPLY_PROMPT.messages.map((msg) =>
        injectVariables(msg, stringArgs),
      ) as Array<{
        role: "user" | "assistant";
        content: { type: "text"; text: string };
      }>,
      maxTokens: 100000,
      temperature: 0.7,
      _meta: {
        callback: "create_reddit_reply",
        responseSchema: responseSchema,
      },
      arguments: stringArgs,
    },
  });

  return {
    content: [
      {
        type: "text",
        text: `Reddit reply creation started, please wait...`,
      },
    ],
  };
};
