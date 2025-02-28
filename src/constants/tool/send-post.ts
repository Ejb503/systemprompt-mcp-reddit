import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendRedditPost: Tool = {
  name: "send_reddit_post",
  description: "Sends a new post to Reddit",
  inputSchema: {
    type: "object",
    properties: {},
  },
  _meta: {
    hidden: true,
    ignore: true,
  },
};
