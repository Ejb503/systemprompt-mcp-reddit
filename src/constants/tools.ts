import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { analyseSubreddit } from "@/constants/tool/analyse-subreddit.js";
import { configureInstructions } from "@/constants/tool/configure-instructions.js";
import { createPost } from "@/constants/tool/create-post.js";
import { createReply } from "@/constants/tool/create-reply.js";
import { fetchPost } from "@/constants/tool/fetch-post.js";
import { getRedditNotifications } from "@/constants/tool/get-notifications.js";
import { getPosts } from "@/constants/tool/get-posts.js";
import { sendRedditPost } from "@/constants/tool/send-post.js";
import { searchReddit } from "@/constants/tool/search-reddit.js";
import { sendReply } from "@/constants/tool/send-reply.js";
import { getComment } from "@/constants/tool/get-comment.js";
import { RedditConfigData } from "@/types/config.js";

export const TOOL_ERROR_MESSAGES = {
  UNKNOWN_TOOL: "Unknown tool:",
  TOOL_CALL_FAILED: "Tool call failed:",
} as const;

export const TOOL_RESPONSE_MESSAGES = {
  ASYNC_PROCESSING: "Request is being processed asynchronously",
} as const;

export const TOOLS: Tool[] = [
  getPosts,
  fetchPost,
  getRedditNotifications,
  analyseSubreddit,
  createPost,
  createReply,
  sendRedditPost,
  configureInstructions,
  searchReddit,
  sendReply,
  getComment,
];

export function populateToolsInitialData(tools: Tool[], configData: RedditConfigData): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}
