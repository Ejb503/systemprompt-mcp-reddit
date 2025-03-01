import { ToolHandler, CreateRedditReplyArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { CREATE_REDDIT_REPLY_PROMPT } from "@/constants/sampling/index.js";
import { createRedditReplySuccessMessage } from "@/constants/tool/create-reply.js";
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
        messageId: { type: "string" },
        reply: {
          type: "object",
          properties: {
            parentId: {
              type: "string",
              description:
                "The ID of the parent post or comment to reply to (must start with t1_ for comments or t3_ for posts)",
              pattern: "^t[1|3]_[a-z0-9]+$",
            },
            text: {
              type: "string",
              description: "The markdown text of the reply (max 10000 characters)",
              maxLength: 10000,
            },
            sendreplies: {
              type: "boolean",
              description: "Whether to send reply notifications",
              default: true,
            },
          },
          required: ["parentId", "text"],
        },
      },
      required: ["status", "messageId", "reply"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleCreateRedditReply: ToolHandler<CreateRedditReplyArgs> = async (
  args,
  { systemPromptService, redditService },
) => {
  try {
    // Fetch configurations
    const configBlocks = await systemPromptService.listBlocks();
    const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

    if (!instructionsBlock) {
      throw new RedditError("Reddit configuration or instructions not found", "VALIDATION_ERROR");
    }

    // Fetch subreddit rules
    const subredditInfo = await redditService.getSubredditInfo(args.subreddit);

    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: "reply",
      parentId: args.parentId,
      redditInstructions: instructionsBlock.content,
      redditConfig: JSON.stringify({
        allowedPostTypes: subredditInfo.allowedPostTypes,
        rules: subredditInfo.rules,
        titleRequirements: subredditInfo.titleRequirements,
        bodyRequirements: subredditInfo.bodyRequirements,
        flairRequired: subredditInfo.flairRequired,
      }),
    };

    const prompt = await handleGetPrompt({
      method: "prompts/get",
      params: {
        name: CREATE_REDDIT_REPLY_PROMPT.name,
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
        messages: CREATE_REDDIT_REPLY_PROMPT.messages.map((msg) =>
          injectVariables(msg, stringArgs),
        ) as Array<{
          role: "user" | "assistant";
          content: { type: "text"; text: string };
        }>,
        maxTokens: 100000,
        temperature: 0.7,
        _meta: {
          callback: "create_reply_callback",
          responseSchema: promptResponseSchema,
        },
        arguments: stringArgs,
      },
    });

    return formatToolResponse({
      message: createRedditReplySuccessMessage,
      result: {
        status: "pending",
        parentId: args.parentId,
      },
      schema: responseSchema,
      type: "sampling",
      title: "Create Reddit Reply",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create Reddit reply: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "sampling",
      title: "Error Creating Reply",
    });
  }
};
