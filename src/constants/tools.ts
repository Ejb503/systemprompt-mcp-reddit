import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { analyseSubreddit } from "@/constants/tool/analyse-subreddit.js";
import { configureInstructions } from "@/constants/tool/configure-instructions.js";
import { createPost } from "@/constants/tool/create-post.js";
import { createComment } from "@/constants/tool/create-comment.js";
import { getPost } from "@/constants/tool/get-post.js";
import { getNotifications } from "@/constants/tool/get-notifications.js";
import { getPosts } from "@/constants/tool/get-posts.js";
import { sendRedditPost } from "@/constants/tool/send-post.js";
import { searchReddit } from "@/constants/tool/search-reddit.js";
import { sendComment } from "@/constants/tool/send-comment.js";
import { getComment } from "@/constants/tool/get-comment.js";
import { deleteContent } from "@/constants/tool/delete-content.js";
import { editContent } from "@/constants/tool/edit-content.js";
import { createMessage } from "@/constants/tool/create-message.js";
import { sendMessage } from "@/constants/tool/send-message.js";
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
  getPost,
  getNotifications,
  analyseSubreddit,
  createPost,
  createComment,
  sendRedditPost,
  configureInstructions,
  searchReddit,
  sendComment,
  getComment,
  deleteContent,
  editContent,
  createMessage,
  sendMessage,
];

export function populateToolsInitialData(tools: Tool[], configData: RedditConfigData): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}
