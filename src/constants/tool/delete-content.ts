import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const deleteContent: Tool = {
  name: "delete_content",
  description: "Delete a Reddit resource (post, reply, comment) or block",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the resource to delete",
      },
    },
    required: ["id"],
  },
  _meta: {
    title: "Delete Content",
    type: "api",
    ignore: true,
    hidden: true,
  },
};
