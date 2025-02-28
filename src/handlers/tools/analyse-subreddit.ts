import { ToolHandler, AnalyseSubredditArgs } from "./types.js";
import { sendSamplingRequest } from "@/handlers/sampling.js";
import { handleGetPrompt } from "@/handlers/prompt-handlers.js";
import { injectVariables } from "@/utils/message-handlers.js";
import { TOOL_ERROR_MESSAGES } from "@/constants/tools.js";
import { ANALYSE_SUBREDDIT_PROMPT } from "@/constants/sampling/analyse-subreddit.js";

export const handleAnalyseSubreddit: ToolHandler<AnalyseSubredditArgs> = async (
  args,
  { redditService },
) => {
  try {
    const hotPosts = await redditService.fetchPosts({
      sort: "hot",
      subreddits: [args.subreddit],
      limit: 10,
    });

    const newPosts = await redditService.fetchPosts({
      sort: "new",
      subreddits: [args.subreddit],
      limit: 10,
    });

    const controversialPosts = await redditService.fetchPosts({
      sort: "controversial",
      subreddits: [args.subreddit],
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

    const responseSchema = prompt._meta?.responseSchema;
    if (!responseSchema) {
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
          responseSchema: responseSchema,
        },
        arguments: stringArgs,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Reddit subreddit analysis started for r/${args.subreddit}, please wait...`,
        },
      ],
    };
  } catch (error) {
    console.error("Failed to analyze subreddit:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to analyze subreddit: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
};
