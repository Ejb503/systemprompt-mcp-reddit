import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const editContent: Tool = {
  name: "edit_content",
  description:
    "Modifies existing Reddit content (posts, comments, or replies). This tool should be used when you need to update, correct, or improve previously submitted content. Common uses include fixing typos, adding clarifications, updating outdated information, or expanding on points based on feedback. Note that Reddit shows an 'edited' indicator on modified content. While the edit history isn't public, it's good practice to maintain transparency about significant changes, perhaps with an 'Edit:' note explaining the changes.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "The unique identifier of the content to edit. Must be a valid Reddit ID with appropriate prefix (t1_ for comments, t3_ for posts). Ensure you have permission to edit the specified content.",
      },
      content: {
        type: "string",
        description:
          "The new content to replace the existing text. Should maintain the context and intent of the original post while incorporating necessary changes. For significant changes, consider adding an 'Edit:' note explaining the modifications. Must follow subreddit rules and Reddit's content policies.",
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
