import {
  ReadResourceRequest,
  ListResourcesResult,
  ReadResourceResult,
  ListResourcesRequest,
} from "@modelcontextprotocol/sdk/types.js";

export async function handleListResources(
  request: ListResourcesRequest,
): Promise<ListResourcesResult> {
  return {
    resources: [],
    _meta: {},
  };
}

export async function handleResourceCall(
  request: ReadResourceRequest,
): Promise<ReadResourceResult> {
  const { uri } = request.params;
  const match = uri.match(/^resource:\/\/\/block\/(.+)$/);

  if (!match) {
    throw new Error("Invalid resource URI format - expected resource:///block/{id}");
  }

  const blockId = match[1];
  if (blockId !== "default") {
    throw new Error("Resource not found");
  }

  return {
    contents: [
      {
        uri: uri,
        mimeType: "text/plain",
        text: "",
      },
    ],
    _meta: { tag: ["agent"] },
  };
}
