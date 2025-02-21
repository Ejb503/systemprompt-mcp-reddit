import { RedditService } from "../services/reddit/reddit-service.js";
import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOLS } from "../constants/tools.js";
import {
  ConfigureRedditArgs,
  FetchRedditContentArgs,
  RedditPreferences,
  RedditSubredditConfig,
  RedditInstructionConfig,
  CreateRedditPostArgs,
  CreateRedditReplyArgs,
} from "../types/tool-schemas.js";
import { TOOL_ERROR_MESSAGES } from "../constants/tools.js";
import { sendSamplingRequest } from "./sampling.js";
import { handleGetPrompt } from "./prompt-handlers.js";
import { injectVariables } from "../utils/message-handlers.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { sendJsonResultNotification } from "./notifications.js";
import { SystempromptBlockRequest, SubredditRules } from "../types/systemprompt.js";
import { RedditError } from "../errors/reddit-error.js";
import {
  RedditPost,
  RedditPostParams,
  RedditPostResponse,
  FetchPostsOptions,
} from "../types/reddit.js";
import {
  CREATE_REDDIT_POST_PROMPT,
  CREATE_REDDIT_REPLY_PROMPT,
} from "../constants/sampling-prompts.js";

export async function handleListTools(request: ListToolsRequest): Promise<ListToolsResult> {
  return { tools: TOOLS };
}

export async function handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
  const redditService = RedditService.getInstance();
  const systemPromptService = SystemPromptService.getInstance();

  try {
    switch (request.params.name) {
      case "configure_reddit": {
        const args = request.params.arguments as unknown;
        sendJsonResultNotification(JSON.stringify(args, null, 2));

        if (!isConfigureRedditArgs(args)) {
          throw new RedditError("Invalid arguments for configure_reddit", "VALIDATION_ERROR");
        }
        const { subreddits } = args;

        try {
          // Remove string parsing since we now only accept arrays
          const subredditRules: Record<string, SubredditRules> = {};
          for (const subreddit of subreddits) {
            const info = await redditService.getSubredditInfo(subreddit);

            // Transform the Reddit info into our SubredditRules format
            subredditRules[subreddit] = {
              allowedPostTypes: info.allowedPostTypes || ["text", "link"],
              rules: info.rules.map((rule) => ({
                title: rule.title,
                description: rule.description,
              })),
              postRequirements: {
                title: {
                  minLength: info.titleRequirements?.minLength,
                  maxLength: info.titleRequirements?.maxLength,
                  allowedPrefixes: info.titleRequirements?.allowedPrefixes,
                  bannedPhrases: info.titleRequirements?.bannedPhrases,
                },
                body: {
                  required: info.bodyRequirements?.required,
                  minLength: info.bodyRequirements?.minLength,
                  maxLength: info.bodyRequirements?.maxLength,
                },
                flairRequired: info.flairRequired,
              },
            };
          }

          const redditConfig: SystempromptBlockRequest = {
            content: JSON.stringify({
              subreddits,
              subredditRules,
            }),
            type: "block",
            prefix: "reddit_config",
            metadata: {
              title: "Reddit Configuration",
              description: "Reddit configuration settings and rules",
              tag: ["mcp_systemprompt_reddit"],
            },
          };

          const result = await systemPromptService.upsertBlock(redditConfig);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    message: "Reddit configuration and rules saved",
                    config: result,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          console.error("Failed to configure Reddit:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to configure Reddit: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
      case "configure_instructions": {
        const args = request.params.arguments;
        sendJsonResultNotification(JSON.stringify(args, null, 2));

        // Basic validation that we have args
        if (!args || typeof args !== "object") {
          throw new Error("Invalid arguments for configure_instructions");
        }

        try {
          // Create the instruction block with only allowed metadata properties
          const instructionBlock: SystempromptBlockRequest = {
            content: JSON.stringify(args),
            type: "block",
            prefix: "reddit_instructions",
            metadata: {
              title: "Reddit Instructions",
              description: "Content creation guidelines for Reddit",
              tag: ["mcp_systemprompt_reddit"],
            },
          };

          // Save the block
          const result = await systemPromptService.upsertBlock(instructionBlock);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    message: "Reddit instructions saved successfully",
                    config: result,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          console.error("Failed to save Reddit instructions:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to save Reddit instructions: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
      case "list_configuration": {
        try {
          const result = await systemPromptService.listBlocks();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error("Failed to configure Reddit:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to configure Reddit: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      }

      case "get_reddit_posts": {
        try {
          const args = request.params.arguments as { sort: "hot" | "new" | "controversial" };

          const configBlocks = await systemPromptService.listBlocks();
          const redditConfigBlock = configBlocks.find((block) => block.prefix === "reddit_config");

          if (!redditConfigBlock) {
            return {
              content: [
                {
                  type: "text",
                  text: "No Reddit configuration found. Please configure Reddit first.",
                },
              ],
            };
          }

          const config = JSON.parse(redditConfigBlock.content as string);
          if (!config.subreddits || !Array.isArray(config.subreddits)) {
            throw new Error("Invalid Reddit configuration: missing or invalid subreddits array");
          }

          const posts = await redditService.fetchPosts({
            sort: args.sort,
            timeFilter: config.preferences?.timeFilter || "day",
            limit: config.preferences?.maxPostsPerRequest || 10,
            subreddits: config.subreddits,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    posts: posts.map((post) => ({
                      title: post.title,
                      subreddit: post.subreddit,
                      url: post.url,
                      score: post.score,
                      numComments: post.numComments,
                      createdUtc: post.createdUtc,
                      summary: post.selftext?.substring(0, 200),
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          console.error("Failed to fetch Reddit content:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to fetch Reddit content: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      }

      case "create_reddit_content": {
        const args = request.params.arguments as {
          type: "post" | "reply";
          subreddit: string;
          content: string;
          messageId?: string;
          kind?: "text" | "link";
          url?: string;
        };

        // Validate arguments based on type
        if (args.type === "reply" && !args.messageId) {
          throw new RedditError("messageId is required for replies", "VALIDATION_ERROR");
        }
        if (args.kind === "link" && !args.url) {
          throw new RedditError("url is required for link posts", "VALIDATION_ERROR");
        }

        // Fetch configurations
        const configBlocks = await systemPromptService.listBlocks();
        const redditConfigBlock = configBlocks.find((block) => block.prefix === "reddit_config");
        const instructionsBlock = configBlocks.find(
          (block) => block.prefix === "reddit_instructions",
        );

        if (!redditConfigBlock || !instructionsBlock) {
          throw new RedditError(
            "Reddit configuration or instructions not found",
            "VALIDATION_ERROR",
          );
        }

        // Convert all values to strings and include configs
        const stringArgs = {
          ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
          redditConfig: redditConfigBlock.content,
          redditInstructions: instructionsBlock.content,
        };

        const promptName =
          args.type === "post" ? CREATE_REDDIT_POST_PROMPT.name : CREATE_REDDIT_REPLY_PROMPT.name;
        const promptMessages =
          args.type === "post"
            ? CREATE_REDDIT_POST_PROMPT.messages
            : CREATE_REDDIT_REPLY_PROMPT.messages;

        const prompt = await handleGetPrompt({
          method: "prompts/get",
          params: {
            name: promptName,
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
            messages: promptMessages.map((msg) => injectVariables(msg, stringArgs)) as Array<{
              role: "user" | "assistant";
              content: { type: "text"; text: string };
            }>,
            maxTokens: 100000,
            temperature: 0.7,
            _meta: {
              callback: args.type === "post" ? "create_reddit_post" : "create_reddit_reply",
              responseSchema: responseSchema,
            },
            arguments: stringArgs,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Reddit ${args.type} creation started, please wait...`,
            },
          ],
        };
      }

      default:
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }
  } catch (error) {
    console.error(TOOL_ERROR_MESSAGES.TOOL_CALL_FAILED, error);
    throw error;
  }
}

// Update type guard
function isConfigureRedditArgs(args: unknown): args is ConfigureRedditArgs {
  if (!args || typeof args !== "object") {
    return false;
  }

  const candidate = args as Partial<ConfigureRedditArgs>;

  // Check subreddits array
  if (!Array.isArray(candidate.subreddits)) {
    return false;
  }

  // Verify all elements are strings
  if (!candidate.subreddits.every((item) => typeof item === "string")) {
    return false;
  }

  // Check preferences if present
  if (candidate.preferences !== undefined) {
    if (typeof candidate.preferences !== "object" || candidate.preferences === null) {
      return false;
    }

    const prefs = candidate.preferences as RedditPreferences;

    // Validate each preference field if present
    if (
      prefs.defaultSort &&
      !["hot", "new", "top", "rising", "controversial"].includes(prefs.defaultSort)
    ) {
      return false;
    }
    if (
      prefs.timeFilter &&
      !["hour", "day", "week", "month", "year", "all"].includes(prefs.timeFilter)
    ) {
      return false;
    }
    if (prefs.contentFilter && !["all", "posts", "comments"].includes(prefs.contentFilter)) {
      return false;
    }
    if (prefs.nsfwFilter !== undefined && typeof prefs.nsfwFilter !== "boolean") {
      return false;
    }
    if (prefs.minimumScore !== undefined && typeof prefs.minimumScore !== "number") {
      return false;
    }
    if (prefs.maxPostsPerRequest !== undefined && typeof prefs.maxPostsPerRequest !== "number") {
      return false;
    }
  }

  return true;
}

function isCreateRedditPostArgs(args: unknown): args is CreateRedditPostArgs {
  if (!args || typeof args !== "object") return false;
  const a = args as Record<string, unknown>;

  // Check required fields first
  if (typeof a.subreddit !== "string" || typeof a.content !== "string") {
    throw new RedditError(
      "Missing or invalid required fields: subreddit and content must be strings",
      "VALIDATION_ERROR",
    );
  }

  // Check kind if present
  if (a.kind !== undefined && a.kind !== "text" && a.kind !== "link") {
    throw new RedditError(
      "Invalid 'kind' value. Must be either 'text' or 'link'",
      "VALIDATION_ERROR",
    );
  }

  // Check url if present
  if (a.kind === "link" && (typeof a.url !== "string" || !a.url)) {
    throw new RedditError("URL is required for link posts", "VALIDATION_ERROR");
  }

  return true;
}

function isCreateRedditReplyArgs(args: unknown): args is CreateRedditReplyArgs {
  if (!args || typeof args !== "object") return false;
  const a = args as Record<string, unknown>;
  return (
    typeof a.subreddit === "string" &&
    typeof a.messageId === "string" &&
    typeof a.content === "string"
  );
}
