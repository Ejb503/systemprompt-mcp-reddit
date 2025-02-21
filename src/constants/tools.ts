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
    _meta: {
      hidden: false,
    },
  },
  {
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
      hidden: false,
    },
  },
  {
    name: "list_configuration",
    description: "Lists all Reddit configurations",
    inputSchema: {
      type: "object",
      properties: {},
    },
    _meta: {
      hidden: false,
    },
  },
  {
    name: "create_reddit_content",
    description: "Creates new content for Reddit (post or reply). This will not post to Reddit.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["post", "reply"],
          description: "Type of content to create",
        },
        subreddit: {
          type: "string",
          description: "The subreddit where the content will be submitted",
        },
        content: {
          type: "string",
          description: "Instructions for generating the content using LLM",
        },
        messageId: {
          type: "string",
          description: "The ID of the post/comment to reply to (required for replies)",
        },
        kind: {
          type: "string",
          enum: ["text", "link"],
          description: "Type of post to create (optional for posts, defaults to text)",
        },
        url: {
          type: "string",
          description: "URL for link posts (required if kind is 'link')",
        },
      },
      required: ["type", "subreddit", "content"],
    },
    _meta: {
      hidden: false,
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
      hidden: true,
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
      hidden: true,
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
    _meta: {
      hidden: false,
    },
  },
];
