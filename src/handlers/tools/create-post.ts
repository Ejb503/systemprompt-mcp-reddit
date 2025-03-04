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
        post: {
          type: "object",
          properties: {
            subreddit: {
              type: "string",
              description: "Subreddit to post to (without r/ prefix)",
            },
            title: {
              type: "string",
              description: "Post title (1-300 characters)",
              minLength: 1,
              maxLength: 300,
            },
            content: {
              type: "string",
              description: "Text content for the post",
            },
            flair: {
              type: "object",
              description: "Flair information for the post",
              properties: {
                id: {
                  type: "string",
                  description: "ID of the selected flair",
                },
                text: {
                  type: "string",
                  description: "Text of the selected flair",
                },
              },
              required: ["id", "text"],
            },
            sendreplies: {
              type: "boolean",
              description: "Whether to send replies to inbox",
              default: true,
            },
            nsfw: {
              type: "boolean",
              description: "Whether to mark as NSFW",
              default: false,
            },
            spoiler: {
              type: "boolean",
              description: "Whether to mark as spoiler",
              default: false,
            },
          },
          required: ["subreddit", "title", "content"],
        },
        availableFlairs: {
          type: "array",
          description: "List of available flairs for the subreddit",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              type: { type: "string", enum: ["text", "richtext", "image"] },
              textEditable: { type: "boolean" },
              backgroundColor: { type: "string" },
              textColor: { type: "string" },
              modOnly: { type: "boolean" },
            },
            required: ["id", "text", "type"],
          },
        },
      },
      required: ["status", "subreddit", "post", "availableFlairs"],
    },
  },
  required: ["status", "message", "result"],
};

export const handleCreateRedditPost: ToolHandler<CreateRedditPostArgs> = async (
  args,
  { systemPromptService, redditService },
) => {
  try {
    const configBlocks = await systemPromptService.listBlocks();
    const instructionsBlock = configBlocks.find((block) => block.prefix === "reddit_instructions");

    if (!instructionsBlock) {
      throw new RedditError("Reddit configuration or instructions not found", "VALIDATION_ERROR");
    }

    // Fetch subreddit info including flairs
    const subredditInfo = await redditService.getSubredditInfo(args.subreddit);
    const flairs = await redditService.getSubredditFlairs(args.subreddit);

    // Convert all values to strings and include configs
    const stringArgs = {
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
      type: "post",
      flairRequired: String(subredditInfo.flairRequired || false),
      availableFlairs: JSON.stringify(flairs),
      subredditRules: JSON.stringify(subredditInfo),
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
      type: "sampling",
      title: "Create Reddit Message",
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
