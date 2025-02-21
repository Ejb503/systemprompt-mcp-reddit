import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TOOL_ERROR_MESSAGES = {
  UNKNOWN_TOOL: "Unknown tool:",
  TOOL_CALL_FAILED: "Tool call failed:",
} as const;

export const TOOL_RESPONSE_MESSAGES = {
  ASYNC_PROCESSING: "Request is being processed asynchronously",
} as const;

export const TOOLS: Tool[] = [
  {
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
  },
  {
    name: "get_hot_posts",
    description: "Fetches hot posts from configured subreddits using saved preferences",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_new_posts",
    description: "Fetches newest posts from configured subreddits using saved preferences",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_controversial_posts",
    description: "Fetches controversial posts from configured subreddits using saved preferences",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_configuration",
    description: "Lists all Reddit configurations",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_reddit_post",
    description: "Creates a new post for Reddit. This will not post the post to Reddit.",
    inputSchema: {
      type: "object",
      properties: {
        subreddit: {
          type: "string",
          description: "The subreddit where the post will be submitted",
        },
        title: {
          type: "string",
          description: "Title of the post",
        },
        content: {
          type: "string",
          description: "Content/body of the post",
        },
        kind: {
          type: "string",
          enum: ["text", "link"],
          description: "Type of post to create",
        },
        url: {
          type: "string",
          description: "URL for link posts",
        },
      },
      required: ["subreddit", "title", "kind"],
    },
  },
  {
    name: "create_reddit_reply",
    description: "Creates a new reply for Reddit. This will not post the reply to Reddit.",
    inputSchema: {
      type: "object",
      properties: {
        subreddit: {
          type: "string",
          description: "The subreddit where the post will be submitted",
        },
        title: {
          type: "string",
          description: "Title of the post",
        },
        content: {
          type: "string",
          description: "Content/body of the post",
        },
        kind: {
          type: "string",
          enum: ["text", "link"],
          description: "Type of post to create",
        },
        url: {
          type: "string",
          description: "URL for link posts",
        },
      },
      required: ["subreddit", "title", "kind"],
    },
  },
  {
    name: "send_reddit_post",
    description: "Sends a new post to Reddit",
    inputSchema: {
      type: "object",
      properties: {},
    },
    _meta: {
      ignore: true,
    },
  },
  {
    name: "delete_reddit_post",
    description: "Deletes a post from Reddit",
    inputSchema: {
      type: "object",
      properties: {},
    },
    _meta: {
      ignore: true,
    },
  },
  {
    name: "configure_instructions",
    description: "Configures instructions for how the LLM should write Reddit content",
    inputSchema: {
      type: "object",
      properties: {
        tones: {
          type: "array",
          description: "Writing tones to use (e.g. casual, professional)",
          items: {
            type: "string",
            enum: [
              "casual",
              "professional",
              "academic",
              "friendly",
              "humorous",
              "formal",
              "empathetic",
            ],
          },
        },
        vocabularyLevel: {
          type: "string",
          enum: ["simple", "moderate", "advanced", "technical", "mixed"],
          description: "Preferred vocabulary complexity",
        },
        useEmoji: {
          type: "boolean",
          description: "Whether to use emoji in content",
        },
        useSlang: {
          type: "boolean",
          description: "Whether to use casual language/slang",
        },
        useMemes: {
          type: "boolean",
          description: "Whether to reference memes",
        },
        culturalContexts: {
          type: "array",
          items: { type: "string" },
          description: "Cultural references to include/understand",
        },
        introStyle: {
          type: "string",
          description: "How to start posts (e.g. question, story, fact)",
        },
        maxParagraphLength: {
          type: "number",
          description: "Maximum sentences per paragraph",
        },
        minPostLength: {
          type: "number",
          description: "Minimum characters per post",
        },
        maxPostLength: {
          type: "number",
          description: "Maximum characters per post",
        },
        requireSources: {
          type: "boolean",
          description: "Whether to require source links",
        },
        factCheckLevel: {
          type: "string",
          enum: ["none", "basic", "thorough"],
          description: "Level of fact checking required",
        },
        avoidedTopics: {
          type: "array",
          items: { type: "string" },
          description: "Topics to avoid discussing",
        },
        preferredTopics: {
          type: "array",
          items: { type: "string" },
          description: "Topics to focus on",
        },
        debateStyle: {
          type: "string",
          enum: ["avoid", "gentle", "factual", "socratic"],
          description: "How to handle disagreements",
        },
        agreeableLevel: {
          type: "string",
          enum: ["very", "moderate", "neutral", "challenging"],
          description: "How agreeable to be in responses",
        },
        participationStyle: {
          type: "string",
          enum: ["observer", "contributor", "active", "leader"],
          description: "Level of community participation",
        },
        coreValues: {
          type: "array",
          items: { type: "string" },
          description: "Key values to reflect in content",
        },
        expertise: {
          type: "array",
          items: { type: "string" },
          description: "Areas of expertise to emphasize",
        },
        backgroundContext: {
          type: "string",
          description: "Relevant background to inform responses",
        },
      },
      required: [
        "tones",
        "vocabularyLevel",
        "minPostLength",
        "maxPostLength",
        "factCheckLevel",
        "debateStyle",
        "participationStyle",
      ],
    },
  },
];
