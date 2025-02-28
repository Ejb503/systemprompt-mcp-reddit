import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const deleteRedditPost: Tool = {
  name: "delete_reddit_post",
  description: "Deletes a post from Reddit",
  inputSchema: {
    type: "object",
    properties: {},
  },
  _meta: {
    hidden: true,
    ignore: true,
  },
};
