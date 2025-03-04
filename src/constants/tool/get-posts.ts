import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getPosts: Tool = {
  name: "get_posts",
  description:
    "Retrieves multiple Reddit posts from a specified subreddit based on sorting criteria. This tool should be used when you want to monitor subreddit activity, analyze trending topics, or find relevant discussions. It provides different sorting options: 'hot' for currently popular posts, 'new' for latest submissions, and 'controversial' for posts with mixed reactions. This is particularly useful for understanding current subreddit trends, finding recent discussions, or identifying contentious topics.",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "string",
        enum: ["hot", "new", "controversial"],
        description:
          "How to sort the retrieved posts: 'hot' shows currently trending posts, 'new' shows most recent submissions, 'controversial' shows posts with significant up/down vote activity.",
      },
      subreddit: {
        type: "string",
        description:
          "The target subreddit to fetch posts from (without the 'r/' prefix). Ensure the subreddit exists and is accessible.",
      },
    },
    required: ["sort", "subreddit"],
  },
  _meta: {
    hidden: true,
    ignore: false,
    title: "Get Posts",
    type: "sampling",
  },
};

export const getPostsSuccessMessage =
  "The user has successfully fetched posts from Reddit. Read and understand the results, present a summary of the results to the user and ask if they would like to fetch another set of posts.";
