import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const analyseSubreddit: Tool = {
  name: "analyse_subreddit",
  description: "Analyzes a subreddit's current state based on recent posts",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit to analyze",
      },
    },
    required: ["subreddit"],
  },
  _meta: {
    hidden: true,
    displayTitle: "Analyse Subreddit",
    type: "sampling",
  },
};

export const analyseSubredditSuccessMessage =
  "The user has submitted a request to analyse a subreddit. The results should arrive in a few seconds. Read and understand the results, present a summary of the results to the user and ask if they would like to analyse another subreddit.";
