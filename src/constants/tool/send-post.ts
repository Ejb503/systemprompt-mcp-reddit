import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendRedditPost: Tool = {
  name: "send_post",
  description: "Sends a new post to Reddit",
  inputSchema: {
    type: "object",
    required: ["subreddit", "title", "kind"],
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
      kind: {
        type: "string",
        enum: ["self", "link"],
        description: "Type of post - 'self' for text posts, 'link' for URL posts",
      },
      content: {
        type: "string",
        description: "Text content for self posts",
      },
      url: {
        type: "string",
        description: "URL for link posts",
        pattern: "^https?://",
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
    allOf: [
      {
        if: { properties: { kind: { const: "self" } } },
        then: { required: ["content"] },
      },
      {
        if: { properties: { kind: { const: "link" } } },
        then: { required: ["url"] },
      },
    ],
  },
  _meta: {
    hidden: true,
    displayTitle: "Send Post",
    type: "server",
  },
};

export const sendRedditPostSuccessMessage =
  "The user has successfully sent a new post to Reddit. Present the post to the user and ask if they would like to send another post.";
