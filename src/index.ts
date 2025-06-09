#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

// Import and run the server for direct execution
import { RedditMCPServer } from "./smithery-entry.js";

// Main execution
async function main() {
  const server = new RedditMCPServer();
  await server.start(3000);
}

// Always run the server when index.ts is executed
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
