import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendRedditPost: Tool = {
  name: "send_post",
  description: "Sends a new text post to Reddit",
  inputSchema: {
    type: "object",
    required: ["subreddit", "title", "content"],
    properties: {
      subreddit: {
        type: "string",
        description: "Subreddit to post to (without r/ prefix)",
      },
      title: {
        type: "string",
        description: "Post title (1-300 characters)",
        minLength: 1,
        maxLength: 300,
      },
      content: {
        type: "string",
        description: "Text content for the post",
      },
      flair_id: {
        type: "string",
        description: "Flair ID if the subreddit requires it",
      },
      flair_text: {
        type: "string",
        description: "Flair text if the subreddit requires it",
      },
      sendreplies: {
        type: "boolean",
        description: "Whether to send replies to inbox",
        default: true,
      },
      nsfw: {
        type: "boolean",
        description: "Whether to mark as NSFW",
        default: false,
      },
      spoiler: {
        type: "boolean",
        description: "Whether to mark as spoiler",
        default: false,
      },
    },
  },
  _meta: {
    hidden: true,
    title: "Send Post",
    type: "server",
  },
};

export const sendRedditPostSuccessMessage =
  "The user has successfully sent a new post to Reddit. Present the post to the user and ask if they would like to send another post.";
