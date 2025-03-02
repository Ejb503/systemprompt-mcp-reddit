import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const deleteContent: Tool = {
  name: "delete_content",
  description: "Delete a Reddit resource (post, reply, comment) or block",
  inputSchema: {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "The ID of the resource to delete",
      },
      resourceType: {
        type: "string",
        enum: ["post", "reply", "comment", "block"],
        description: "The type of resource being deleted",
      },
    },
    required: ["resourceId", "resourceType"],
  },
  _meta: {
    displayTitle: "Delete Content",
    type: "api",
    ignore: true,
    hidden: true,
  },
};
