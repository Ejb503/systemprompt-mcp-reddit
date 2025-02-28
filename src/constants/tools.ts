import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { analyseSubreddit } from "@/constants/tool/analyse-subreddit.js";
import { configureInstructions } from "@/constants/tool/configure-instructions.js";
import { configureReddit } from "@/constants/tool/configure-reddit.js";
import { createRedditPost } from "@/constants/tool/create-post.js";
import { createRedditReply } from "@/constants/tool/create-reply.js";
import { deleteRedditPost } from "@/constants/tool/delete-draft.js";
import { fetchPost } from "@/constants/tool/fetch-post.js";
import { getRedditNotifications } from "@/constants/tool/get-notifiations.js";
import { getRedditPosts } from "@/constants/tool/get-posts.js";
import { sendRedditPost } from "@/constants/tool/send-post.js";
import { RedditConfigData } from "@/types/config.js";

export const TOOL_ERROR_MESSAGES = {
  UNKNOWN_TOOL: "Unknown tool:",
  TOOL_CALL_FAILED: "Tool call failed:",
} as const;

export const TOOL_RESPONSE_MESSAGES = {
  ASYNC_PROCESSING: "Request is being processed asynchronously",
} as const;

export const TOOLS: Tool[] = [
  configureReddit,
  getRedditPosts,
  fetchPost,
  getRedditNotifications,
  analyseSubreddit,
  createRedditPost,
  createRedditReply,
  sendRedditPost,
  deleteRedditPost,
  configureInstructions,
];

export function populateToolsInitialData(tools: Tool[], configData: RedditConfigData): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };

    // if (
    //   tool.name === "create_reddit_post" &&
    //   configData.subreddits &&
    //   configData.subreddits.length > 0
    // ) {
    //   clonedTool._meta = {
    //     ...(clonedTool._meta || {}),
    //     initialData: {
    //       subreddit: configData.subreddits[0] || "",
    //     },
    //   };
    // }

    // if (
    //   tool.name === "create_reddit_reply" &&
    //   configData.subreddits &&
    //   configData.subreddits.length > 0
    // ) {
    //   clonedTool._meta = {
    //     ...(clonedTool._meta || {}),
    //     initialData: {
    //       subreddit: configData.subreddits,
    //     },
    //   };
    // }

    // if (
    //   tool.name === "analyse_subreddit" &&
    //   configData.subreddits &&
    //   configData.subreddits.length > 0
    // ) {
    //   clonedTool._meta = {
    //     ...(clonedTool._meta || {}),
    //     initialData: {
    //       subreddit: configData.subreddits,
    //     },
    //   };
    // }

    return clonedTool;
  });
}
