import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendRedditPost: Tool = {
  name: "send_post",
  description: "Sends a new post to Reddit",
  inputSchema: {
    type: "object",
    properties: {},
  },
  _meta: {
    hidden: true,
    ignore: true,
    displayTitle: "Send Post",
    type: "server",
  },
};

export const sendRedditPostSuccessMessage =
  "The user has successfully sent a new post to Reddit. Present the post to the user and ask if they would like to send another post.";
