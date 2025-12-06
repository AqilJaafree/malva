# Multi-stage build for optimized image size
FROM public.ecr.aws/docker/library/node:20-slim AS builder

WORKDIR /app

# Copy package files from malva-mcp directory
COPY malva-mcp/package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code from malva-mcp directory
COPY malva-mcp/tsconfig.json ./
COPY malva-mcp/src ./src

# Build the TypeScript project
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/node:20-slim

# Create non-root user for security
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

WORKDIR /app

# Copy package files from malva-mcp directory
COPY malva-mcp/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]
