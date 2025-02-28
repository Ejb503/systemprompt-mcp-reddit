import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const fetchPost: Tool = {
  name: "fetch_post",
  description: "Fetches a single Reddit post by its ID, including all comments and reply threads",
  inputSchema: {
    type: "object",
    properties: {
      postId: {
        type: "string",
        description: "The ID of the post to fetch",
      },
    },
    required: ["postId"],
  },
  _meta: {
    hidden: false,
  },
};
