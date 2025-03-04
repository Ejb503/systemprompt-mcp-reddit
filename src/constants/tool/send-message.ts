import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const sendMessage: Tool = {
  name: "send_message",
  description: "Sends a Reddit message to another user",
  inputSchema: {
    type: "object",
    required: ["recipient", "subject", "content"],
    properties: {
      recipient: {
        type: "string",
        description: "Username of the message recipient",
      },
      subject: {
        type: "string",
        description: "Subject line of the message (1-100 chars)",
        minLength: 1,
        maxLength: 100,
      },
      content: {
        type: "string",
        description: "Message content in markdown format (max 10000 chars)",
        maxLength: 10000,
      },
    },
  },
  _meta: {
    hidden: true,
    ignore: true,
    title: "Send Message",
    type: "server",
  },
};

export const sendRedditMessageSuccessMessage =
  "Successfully sent the message. The message has been delivered to the recipient. Would you like to send another message?";
