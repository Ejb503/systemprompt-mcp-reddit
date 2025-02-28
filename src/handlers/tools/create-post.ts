import { ToolHandler, CreateRedditPostArgs } from "./types.js";
import { CREATE_REDDIT_POST_PROMPT } from "@/constants/sampling/index.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";

export const handleCreateRedditPost: ToolHandler<CreateRedditPostArgs> = async (
  args,
  { systemPromptService },
) => {
  const configBlocks = await systemPromptService.listBlocks();
  const redditConfigBlock = configBlocks.find((block) => block.prefix === "reddit_config");
  const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

  if (!redditConfigBlock || !instructionsBlock) {
    throw new Error("Reddit configuration or instructions not found");
  }

  // Convert all values to strings and include configs
  const stringArgs = {
    ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
    type: "post", // Explicitly set the type for the prompt
    kind: "text", // Always force text posts
    redditConfig: redditConfigBlock.content,
    redditInstructions: instructionsBlock.content,
  };

  const prompt = await handleGetPrompt({
    method: "prompts/get",
    params: {
      name: CREATE_REDDIT_POST_PROMPT.name,
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
      messages: CREATE_REDDIT_POST_PROMPT.messages.map((msg) =>
        injectVariables(msg, stringArgs),
      ) as Array<{
        role: "user" | "assistant";
        content: { type: "text"; text: string };
      }>,
      maxTokens: 100000,
      temperature: 0.7,
      _meta: {
        callback: "create_reddit_post",
        responseSchema: responseSchema,
      },
      arguments: stringArgs,
    },
  });

  return {
    content: [
      {
        type: "text",
        text: `Reddit post creation started, please wait...`,
      },
    ],
  };
};
