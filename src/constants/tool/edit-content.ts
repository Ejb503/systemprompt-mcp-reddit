import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const editContent: Tool = {
  name: "edit_content",
  description: "Edit a Reddit resource (post, reply, comment) or block",
  inputSchema: {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "The ID of the resource to edit",
      },
      resourceType: {
        type: "string",
        enum: ["post", "reply", "comment", "block"],
        description: "The type of resource being edited",
      },
      content: {
        type: "string",
        description: "The new content for the resource",
      },
    },
    required: ["resourceId", "resourceType", "content"],
  },
  _meta: {
    displayTitle: "Edit Content",
    type: "api",
    ignore: true,
    hidden: true,
  },
};
