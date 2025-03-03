import { ToolHandler, AnalyseSubredditArgs, formatToolResponse } from "./types.js";
import { RedditError } from "@/types/reddit.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { ANALYSE_SUBREDDIT_PROMPT } from "@/constants/sampling/analyse-subreddit.js";
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

export const handleAnalyseSubreddit: ToolHandler<AnalyseSubredditArgs> = async (
  args,
  { redditService },
) => {
  try {
    const hotPosts = await redditService.fetchPosts({
      sort: "hot",
      subreddit: args.subreddit,
      limit: 10,
    });

    const newPosts = await redditService.fetchPosts({
      sort: "new",
      subreddit: args.subreddit,
      limit: 10,
    });

    const controversialPosts = await redditService.fetchPosts({
      sort: "controversial",
      subreddit: args.subreddit,
      limit: 10,
    });

    const stringArgs = {
      subreddit: args.subreddit,
      hotPosts: JSON.stringify(hotPosts),
      newPosts: JSON.stringify(newPosts),
      controversialPosts: JSON.stringify(controversialPosts),
    };

    const prompt = await handleGetPrompt({
      method: "prompts/get",
      params: {
        name: ANALYSE_SUBREDDIT_PROMPT.name,
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
        messages: ANALYSE_SUBREDDIT_PROMPT.messages.map((msg) =>
          injectVariables(msg, stringArgs),
        ) as Array<{
          role: "user" | "assistant";
          content: { type: "text"; text: string };
        }>,
        maxTokens: 100000,
        temperature: 0.7,
        _meta: {
          callback: "analyse_subreddit_callback",
          responseSchema: promptResponseSchema,
        },
        arguments: stringArgs,
      },
    });

    return formatToolResponse({
      message: `Reddit subreddit analysis started for r/${args.subreddit}, please wait...`,
      result: {
        status: "pending",
        subreddit: args.subreddit,
      },
      schema: responseSchema,
      type: "sampling",
      title: "Subreddit Analysis",
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to analyze subreddit: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: error instanceof RedditError ? error.type : "API_ERROR",
        details: error,
      },
      type: "sampling",
      title: "Error Analyzing Subreddit",
    });
  }
};
