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
    hidden: false,
  },
};
