import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const configureInstructions: Tool = {
  name: "configure_instructions",
  description: "Configures instructions for how the LLM should write Reddit content",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Instructions for generating the content using LLM",
      },
    },
    required: ["content"],
  },
  _meta: {
    hidden: false,
    title: "Configure Instructions",
    type: "api",
  },
};

export const configureInstructionsSuccessMessage =
  "The user has successfully configured the instructions for how the LLM should write Reddit content. Present the instructions to the user.";
