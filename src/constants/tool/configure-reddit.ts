import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const configureReddit: Tool = {
  name: "configure_reddit",
  description: "Configures Reddit settings and communities for the agent to interact with",
  inputSchema: {
    type: "object",
    properties: {
      subreddits: {
        type: "array",
        description: "List of subreddit names to configure",
        items: {
          type: "string",
          description: "Name of the subreddit",
        },
      },
    },
    required: ["subreddits"],
  },
  _meta: {
    hidden: false,
  },
};
