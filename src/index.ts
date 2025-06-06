#!/usr/bin/env node
// Import and run the server for direct execution
import { RedditMCPServer } from "./smithery-entry.js";

// Main execution
async function main() {
  const server = new RedditMCPServer();
  await server.start(parseInt(process.env.PORT || "3000", 10));
}

// Run the server when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
