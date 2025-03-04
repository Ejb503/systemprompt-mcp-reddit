import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createMessage: Tool = {
  name: "create_message",
  description:
    "Creates a draft of a private Reddit message to another user. This tool should be used when you want to initiate a private conversation with another Reddit user. It's suitable for personal communications, inquiries, or follow-ups that shouldn't be public. The tool creates a draft that can be reviewed and edited before sending. Note that this only creates the message - it doesn't send it automatically. Messages should be concise, clear, and follow Reddit's guidelines for private communications.",
  inputSchema: {
    type: "object",
    properties: {
      recipient: {
        type: "string",
        description: "The Reddit username of the recipient (without the 'u/' prefix)",
      },
      subject: {
        type: "string",
        description:
          "A clear, concise subject line that summarizes the message purpose (1-100 characters)",
        maxLength: 100,
      },
      content: {
        type: "string",
        description:
          "Instructions for generating the message content. The message should be polite, clear, and formatted in markdown. Must not exceed 10000 characters. Should include proper greeting and closing.",
        maxLength: 10000,
      },
    },
    required: ["recipient", "subject", "content"],
  },
  _meta: {
    hidden: false,
    ignore: false,
    title: "Create Message",
    type: "api",
    callback: "create_message_callback",
  },
};

export const createRedditMessageSuccessMessage =
  "The user has successfully created a new Reddit message. Present the message to the user and congratulate them on their new message.";
