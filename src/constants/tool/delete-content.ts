import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const deleteContent: Tool = {
  name: "delete_content",
  description:
    "Permanently removes a Reddit resource such as a post, comment, or reply. This tool should be used when content needs to be removed from Reddit, whether due to errors, inappropriate content, or user request. Note that deletion is permanent and cannot be undone. Use this tool carefully as it permanently removes the content from Reddit's public view, though it may still be visible in some Reddit archives. This tool is particularly useful for removing mistakenly posted content or managing your Reddit presence.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "The unique identifier of the content to delete. Must be a valid Reddit ID with appropriate prefix (t1_ for comments, t3_ for posts). Ensure you have permission to delete the specified content.",
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
