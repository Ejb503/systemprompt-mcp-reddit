import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const configureInstructions: Tool = {
  name: "configure_instructions",
  description:
    "Configures custom instructions for how the AI should generate Reddit content. This tool should be used to set specific guidelines, tone preferences, and content rules that will be applied to all generated Reddit content. You can specify writing style (formal, casual, technical), content preferences (length, formatting, structure), and any specific requirements (including/excluding certain topics, handling sensitive content). These instructions help maintain consistency and appropriateness across all generated Reddit content.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description:
          "Detailed instructions for content generation, including style guidelines, formatting preferences, and content rules. Should specify any required patterns, structures, or conventions to follow.",
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
