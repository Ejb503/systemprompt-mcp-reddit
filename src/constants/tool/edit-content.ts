import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const editContent: Tool = {
  name: "edit_content",
  description: "Edit a Reddit resource (post, reply, comment) or block",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the resource to edit",
      },
      content: {
        type: "string",
        description: "The new content for the resource",
      },
    },
    required: ["id", "content"],
  },
  _meta: {
    title: "Edit Content",
    type: "api",
    ignore: true,
    hidden: true,
  },
};
