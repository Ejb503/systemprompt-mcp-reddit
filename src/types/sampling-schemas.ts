import { JSONSchema7 } from "json-schema";

export const EMAIL_SEND_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    to: {
      type: "string",
      description: "Recipient email address(es). Multiple addresses can be comma-separated.",
    },
    subject: {
      type: "string",
      description: "Email subject line.",
    },
    body: {
      type: "string",
      description: "Email body content. Must be valid HTML.",
    },
    cc: {
      type: "string",
      description: "CC recipient email address(es). Multiple addresses can be comma-separated.",
    },
    bcc: {
      type: "string",
      description: "BCC recipient email address(es). Multiple addresses can be comma-separated.",
    },
    isHtml: {
      type: "boolean",
      description: "Whether the body content is HTML. Defaults to false for plain text.",
    },
    replyTo: {
      type: "string",
      description: "Reply-to email address.",
    },
    attachments: {
      type: "array",
      description: "List of attachments to include in the email.",
      items: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Name of the attachment file.",
          },
          content: {
            type: "string",
            description: "Content of the attachment (base64 encoded for binary files).",
          },
          contentType: {
            type: "string",
            description: "MIME type of the attachment.",
          },
        },
        required: ["filename", "content"],
      },
    },
  },
  required: ["to", "subject", "body"],
};

export const EMAIL_REPLY_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    replyTo: {
      type: "string",
      description: "Message ID to reply to.",
    },
    body: {
      type: "string",
      description: "Email body content. Must be valid HTML if isHtml is true.",
    },
    isHtml: {
      type: "boolean",
      description: "Whether the body content is HTML. Defaults to false for plain text.",
    },
  },
  required: ["replyTo", "body"],
};

export const DRAFT_EMAIL_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    to: {
      type: "string",
      description: "Recipient email address(es). Multiple addresses can be comma-separated.",
    },
    subject: {
      type: "string",
      description: "Email subject line.",
    },
    body: {
      type: "string",
      description: "Email body content. Must be valid HTML.",
    },
    cc: {
      type: "string",
      description: "CC recipient email address(es). Multiple addresses can be comma-separated.",
    },
    bcc: {
      type: "string",
      description: "BCC recipient email address(es). Multiple addresses can be comma-separated.",
    },
    isHtml: {
      type: "boolean",
      description: "Whether the body content is HTML. Defaults to false for plain text.",
    },
    replyTo: {
      type: "string",
      description: "Message ID to reply to for draft replies.",
    },
    id: {
      type: "string",
      description: "Draft ID for updating existing drafts.",
    },
    attachments: {
      type: "array",
      description: "List of attachments to include in the email.",
      items: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Name of the attachment file.",
          },
          content: {
            type: "string",
            description: "Content of the attachment (base64 encoded for binary files).",
          },
          contentType: {
            type: "string",
            description: "MIME type of the attachment.",
          },
        },
        required: ["filename", "content"],
      },
    },
  },
  required: ["to", "subject", "body"],
};

export const REDDIT_POST_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Generated title for the post",
    },
    content: {
      type: "string",
      description: "Generated content for the post",
    },
    kind: {
      type: "string",
      enum: ["text", "link"],
      description: "Type of post",
    },
    subreddit: {
      type: "string",
      description: "Subreddit to post to",
    },
    url: {
      type: "string",
      description: "URL for link posts",
    },
  },
  required: ["title", "content", "kind", "subreddit"],
};

export const REDDIT_REPLY_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "Generated content for the reply",
    },
    subreddit: {
      type: "string",
      description: "Subreddit context",
    },
    messageId: {
      type: "string",
      description: "ID of message being replied to",
    },
  },
  required: ["content", "subreddit", "messageId"],
};

export const REDDIT_SUGGEST_ACTION_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    action: {
      type: "string",
      description: "Suggested action to take (e.g., 'create_post', 'reply', 'wait')",
    },
    subreddit: {
      type: "string",
      description: "Suggested subreddit for the action",
    },
    reasoning: {
      type: "string",
      description: "Explanation for why this action is suggested",
    },
    content: {
      type: "string",
      description: "Suggested content or topic for the action",
    },
    messageId: {
      type: "string",
      description: "ID of message to reply to (if action is 'reply')",
    },
  },
  required: ["action", "reasoning"],
};

export const REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    subreddit: {
      type: "string",
      description: "Name of the analyzed subreddit",
    },
    summary: {
      type: "string",
      description: "Overall summary of the subreddit's current state",
    },
    trendingTopics: {
      type: "array",
      description: "List of trending topics in the subreddit",
      items: {
        type: "string",
      },
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "mixed"],
      description: "Overall sentiment of the subreddit",
    },
    recommendedActions: {
      type: "array",
      description: "Recommended actions based on the analysis",
      items: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Recommended action",
          },
          reason: {
            type: "string",
            description: "Reason for the recommendation",
          },
        },
        required: ["action", "reason"],
      },
    },
  },
  required: ["subreddit", "summary", "trendingTopics", "sentiment", "recommendedActions"],
};
