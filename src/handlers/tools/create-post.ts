import { ToolHandler, CreateRedditPostArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { CREATE_REDDIT_POST_PROMPT } from "@/constants/sampling/index.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { createRedditPostSuccessMessage } from "@/constants/tool/create-post.js";
import { JSONSchema7 } from "json-schema";

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending"] },
        subreddit: { type: "string" },
      },
      required: ["status", "subreddit"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleCreateRedditPost: ToolHandler<CreateRedditPostArgs> = async (
  args,
  { systemPromptService },
) => {
  try {
    const configBlocks = await systemPromptService.listBlocks();
    const redditConfigBlock = configBlocks.find((block) => block.prefix === "reddit_config");
    const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

    if (!redditConfigBlock || !instructionsBlock) {
      throw new RedditError("Reddit configuration or instructions not found", "VALIDATION_ERROR");
    }

    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: "post", // Explicitly set the type for the prompt
      kind: "self", // Always force text posts
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

    const promptResponseSchema = prompt._meta?.responseSchema;
    if (!promptResponseSchema) {
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
          callback: "create_post_callback",
          responseSchema: promptResponseSchema,
        },
        arguments: stringArgs,
      },
    });

    return formatToolResponse({
      message: createRedditPostSuccessMessage,
      result: {
        status: "pending",
        subreddit: args.subreddit,
      },
      schema: responseSchema,
      type: "sampling",
      title: "Create Reddit Post",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create Reddit post: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "sampling",
      title: "Error Creating Post",
    });
  }
};
