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
} from "../types/tool-schemas.js";
import { TOOL_ERROR_MESSAGES } from "../constants/tools.js";
import { sendSamplingRequest } from "./sampling.js";
import { handleGetPrompt } from "./prompt-handlers.js";
import { injectVariables } from "../utils/message-handlers.js";
import { SystemPromptService } from "../services/systemprompt-service.js";
import { sendJsonResultNotification } from "./notifications.js";
import {
  SystempromptBlockRequest,
  RedditConfigContent,
  SubredditRules,
} from "../types/systemprompt.js";
import { RedditError } from "../errors/reddit-error.js";
import {
  RedditPost,
  RedditPostParams,
  RedditPostResponse,
  FetchPostsOptions,
} from "../types/reddit.js";
import { REDDIT_AGENT_PROMPTS, RedditAgentConfig, POST_VALIDATION_RULES } from "../constants/agent.js";

export async function handleListTools(request: ListToolsRequest): Promise<ListToolsResult> {
  return { tools: TOOLS };
}

// Add new interface for post arguments
interface RedditPostArgs {
  subreddit: string;
  title: string;
  content?: string;
  kind: "text" | "link";
  url?: string;
}

// Add these new interfaces near the top with other interfaces
interface RedditAgentPostRequest {
  subreddit: string;
  topic?: string;
  contentType: "text" | "link";
  customInstructions?: string[];
}

interface GeneratedPost {
  title: string;
  content?: string;
  url?: string;
}

// Add this new function before handleToolCall
async function createAgentPost(request: RedditAgentPostRequest): Promise<RedditPostArgs> {
  const systemPromptService = SystemPromptService.getInstance();
  const redditService = RedditService.getInstance();

  // Get configuration and instructions
  const configBlocks = await systemPromptService.listBlocks();
  const redditConfig = configBlocks.find(block => block.prefix === "reddit_config");
  const instructionsBlock = configBlocks.find(block => block.prefix === "reddit_instructions");

  if (!redditConfig) {
    throw new Error("Reddit configuration not found");
  }

  const config = JSON.parse(redditConfig.content as string);
  const instructions = instructionsBlock ? JSON.parse(instructionsBlock.content as string) : {};

  // Validate subreddit is configured
  if (!config.subredditRules?.[request.subreddit]) {
    throw new Error(`Subreddit ${request.subreddit} not configured`);
  }

  // Get recent posts for context and to avoid duplication
  const recentPosts = await redditService.fetchPosts({
    sort: "new",
    subreddits: [request.subreddit],
    limit: 10,
  });

  // Prepare context for content generation
  const promptContext = {
    subreddit: request.subreddit,
    rules: config.subredditRules[request.subreddit],
    recentPosts: recentPosts.map(post => ({
      title: post.title,
      summary: post.selftext?.substring(0, 200),
    })),
    topic: request.topic,
    contentType: request.contentType,
    customInstructions: [...(instructions.guidelines || []), ...(request.customInstructions || [])],
  };

  // Generate post using the sampling service
  const postContent = await sendSamplingRequest({
    prompt: JSON.stringify(promptContext),
    temperature: 0.7,
  });

  // Parse and validate the generated content
  const generatedPost = JSON.parse(postContent) as GeneratedPost;
  
  // Validate against rules
  if (generatedPost.title.length < POST_VALIDATION_RULES.MINIMUM_TITLE_LENGTH ||
      generatedPost.title.length > POST_VALIDATION_RULES.MAXIMUM_TITLE_LENGTH) {
    throw new Error("Generated title length does not meet requirements");
  }

  if (request.contentType === "text" && generatedPost.content && 
      (generatedPost.content.length < POST_VALIDATION_RULES.MINIMUM_CONTENT_LENGTH ||
       generatedPost.content.length > POST_VALIDATION_RULES.MAXIMUM_CONTENT_LENGTH)) {
    throw new Error("Generated content length does not meet requirements");
  }

  return {
    subreddit: request.subreddit,
    title: generatedPost.title,
    content: request.contentType === "text" ? generatedPost.content : undefined,
    kind: request.contentType,
    url: request.contentType === "link" ? generatedPost.url : undefined,
  };
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
          console.log("Validation failed for args:", {
            hasSubreddits: Boolean(args && typeof args === "object" && "subreddits" in args),
            subredditsType:
              args && typeof args === "object" ? typeof (args as any).subreddits : "undefined",
            isArray:
              args && typeof args === "object" ? Array.isArray((args as any).subreddits) : false,
          });
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

          const redditConfig: SystempromptBlockRequest<RedditConfigContent> = {
            content: {
              subreddits,
              subredditRules,
            },
            type: "block",
            prefix: "reddit_config",
            metadata: {
              title: "Reddit Configuration",
              description: "Reddit configuration settings and rules",
              tag: ["mcp_systemprompt_reddit"],
            },
          };

          // Stringify the content before saving
          const blockToSave = {
            ...redditConfig,
            content: JSON.stringify(redditConfig.content),
          };

          const result = await systemPromptService.upsertBlock(blockToSave);

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
          // Create the instruction block
          const instructionBlock: SystempromptBlockRequest<unknown> = {
            content: args,
            type: "block",
            prefix: "reddit_instructions",
            metadata: {
              title: "Reddit Instructions",
              description: "Content creation guidelines for Reddit",
              tag: ["mcp_systemprompt_reddit"],
            },
          };

          // Save the block
          const result = await systemPromptService.upsertBlock({
            ...instructionBlock,
            content: JSON.stringify(instructionBlock.content),
          });

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

      case "get_hot_posts":
      case "get_new_posts":
      case "get_controversial_posts": {
        try {
          const configBlock = await systemPromptService.listBlocks();
          if (!configBlock || configBlock.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No Reddit configuration found. Please configure Reddit first.",
                },
              ],
            };
          }
          sendJsonResultNotification("Config block received:");
          const config = JSON.parse(configBlock[0].content as string);
          sendJsonResultNotification(JSON.stringify(config, null, 2));

          if (!config.subreddits || !Array.isArray(config.subreddits)) {
            throw new Error("Invalid Reddit configuration: missing or invalid subreddits array");
          }

          // Map tool name to sort type
          const sortType = {
            get_hot_posts: "hot",
            get_new_posts: "new",
            get_controversial_posts: "controversial",
          }[request.params.name] as "hot" | "new" | "controversial";

          const posts = await redditService.fetchPosts({
            sort: sortType,
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

      case "create_reddit_post": {
        const args = request.params.arguments as Record<string, unknown>;
        const postArgs: RedditPostArgs = {
          subreddit: args.subreddit as string,
          title: args.title as string,
          content: args.content as string | undefined,
          kind: args.kind as "text" | "link",
          url: args.url as string | undefined,
        };

        try {
          // Validate the post arguments
          if (postArgs.kind === "link" && !postArgs.url) {
            throw new Error("URL is required for link posts");
          }

          // Create a block to store the post
          const postBlock: SystempromptBlockRequest<unknown> = {
            content: postArgs,
            type: "block",
            prefix: "reddit_post",
            metadata: {
              title: "Reddit Post",
              description: "Prepared Reddit post content",
              tag: ["mcp_systemprompt_reddit_post"],
            },
          };

          // Save the block with stringified content
          const result = await systemPromptService.upsertBlock({
            ...postBlock,
            content: JSON.stringify(postBlock.content),
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    message: "Post prepared successfully",
                    post: result,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          console.error("Failed to create Reddit post:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to create Reddit post: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      }

      case "create_agent_post": {
        const args = request.params.arguments as RedditAgentPostRequest;
        
        try {
          const post = await createAgentPost(args);
          
          // Create the post using the existing create_reddit_post logic
          const result = await handleToolCall({
            ...request,
            params: {
              name: "create_reddit_post",
              arguments: post,
            },
          });

          return result;
        } catch (error) {
          console.error("Failed to create agent post:", error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to create agent post: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
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
