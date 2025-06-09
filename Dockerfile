FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Smithery will override this but good for documentation)
EXPOSE 3000

# Start the HTTP server (not just the MCP server)
CMD ["node", "build/smithery-entry.js"]