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
    hidden: true,
    displayTitle: "Fetch Post",
    type: "server",
  },
};

export const fetchPostSuccessMessage =
  "The user has fetched a post from Reddit. Read and understand the results, present a summary of the results to the user and ask if they would like to fetch another post.";
