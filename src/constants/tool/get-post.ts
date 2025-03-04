import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getPost: Tool = {
  name: "get_post",
  description:
    "Retrieves a complete Reddit post including its title, content, metadata, and all associated comments and reply threads. This tool should be used when you need to examine a specific post's full context, including its discussion. It's particularly useful for understanding the complete conversation around a post, analyzing community responses, or preparing to engage with the discussion. The tool provides access to all post details including awards, vote counts, posting time, and the full comment tree.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "The unique identifier of the post to retrieve. Must be a valid Reddit post ID (prefixed with 't3_'). The ID can be found in the post's URL or through Reddit's API.",
      },
    },
    required: ["id"],
  },
  _meta: {
    hidden: true,
    title: "Get Post",
    type: "server",
  },
};

export const getPostSuccessMessage =
  "The user has retrieved a post from Reddit. Read and understand the results, present a summary of the results to the user and ask if they would like to get another post.";
