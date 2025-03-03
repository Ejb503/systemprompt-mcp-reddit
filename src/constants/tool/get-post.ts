import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getPost: Tool = {
  name: "get_post",
  description: "Fetches a single Reddit post by its ID, including all comments and reply threads",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the post to fetch",
      },
    },
    required: ["id"],
  },
  _meta: {
    hidden: true,
    displayTitle: "Get Post",
    type: "server",
  },
};

export const getPostSuccessMessage =
  "The user has retrieved a post from Reddit. Read and understand the results, present a summary of the results to the user and ask if they would like to get another post.";
