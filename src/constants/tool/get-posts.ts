import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getPosts: Tool = {
  name: "get_reddit_posts",
  description: "Fetches posts from configured subreddits using saved preferences",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "string",
        enum: ["hot", "new", "controversial"],
        description: "How to sort the posts",
      },
    },
    required: ["sort"],
  },
  _meta: {
    hidden: true,
    ignore: false,
    displayTitle: "Get Posts",
    type: "sampling",
  },
};

export const getPostsSuccessMessage =
  "The user has successfully fetched posts from Reddit. Read and understand the results, present a summary of the results to the user and ask if they would like to fetch another set of posts.";
