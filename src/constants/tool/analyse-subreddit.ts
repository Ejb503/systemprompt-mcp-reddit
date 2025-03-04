import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const analyseSubreddit: Tool = {
  name: "analyse_subreddit",
  description:
    "Analyzes a subreddit's current state and trends by examining recent posts and activity. This tool should be used when you need to understand the current topics, discussions, and engagement patterns within a specific subreddit. It provides insights into post frequency, popular topics, common themes, and overall community engagement. Use this to gauge the subreddit's atmosphere before creating posts or to understand what content performs well.",
  inputSchema: {
    type: "object",
    properties: {
      subreddit: {
        type: "string",
        description: "The subreddit to analyze (without the 'r/' prefix)",
      },
    },
    required: ["subreddit"],
  },
  _meta: {
    hidden: true,
    title: "Analyse Subreddit",
    type: "sampling",
    callback: "analyse_subreddit_callback",
  },
};

export const analyseSubredditSuccessMessage =
  "The user has submitted a request to analyse a subreddit. The results should arrive in a few seconds. Read and understand the results, present a summary of the results to the user and ask if they would like to analyse another subreddit.";
