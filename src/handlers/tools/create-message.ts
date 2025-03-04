import { ToolHandler, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { CREATE_REDDIT_MESSAGE_PROMPT } from "@/constants/sampling/index.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { createRedditMessageSuccessMessage } from "@/constants/tool/create-message.js";
import { JSONSchema7 } from "json-schema";
import { PromptMessage } from "@modelcontextprotocol/sdk/types.js";

const responseSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
    result: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending"] },
        message: {
          type: "object",
          properties: {
            recipient: {
              type: "string",
              description: "Username of the message recipient",
            },
            subject: {
              type: "string",
              description: "Subject line of the message (1-100 chars)",
              minLength: 1,
              maxLength: 100,
            },
            content: {
              type: "string",
              description: "Message content in markdown format (max 10000 chars)",
              maxLength: 10000,
            },
          },
          required: ["recipient", "subject", "content"],
        },
      },
      required: ["status", "message"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleCreateRedditMessage: ToolHandler<{
  recipient: string;
  subject: string;
  content: string;
}> = async (args, { systemPromptService }) => {
  try {
    const configBlocks = await systemPromptService.listBlocks();
    const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

    if (!instructionsBlock) {
      throw new RedditError("Reddit configuration or instructions not found", "VALIDATION_ERROR");
    }

    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: "message",
      redditInstructions: instructionsBlock.content,
    };

    const prompt = await handleGetPrompt({
      method: "prompts/get",
      params: {
        name: CREATE_REDDIT_MESSAGE_PROMPT.name,
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
        messages: CREATE_REDDIT_MESSAGE_PROMPT.messages.map((msg) =>
          injectVariables(msg, stringArgs),
        ) as Array<{
          role: "user" | "assistant";
          content: { type: "text"; text: string };
        }>,
        maxTokens: 100000,
        temperature: 0.7,
        _meta: {
          callback: "create_message_callback",
          responseSchema: promptResponseSchema,
        },
        arguments: stringArgs,
      },
    });

    return formatToolResponse({
      message: createRedditMessageSuccessMessage,
      result: {
        status: "pending",
        message: createRedditMessageSuccessMessage,
      },
      type: "sampling",
      title: "Create Reddit Message",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create Reddit message: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "sampling",
      title: "Error Creating Message",
    });
  }
};
