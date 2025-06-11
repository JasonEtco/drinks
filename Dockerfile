# Multi-stage build for Drinks Cocktail Recipe Manager
# Stage 1: Build the application
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:24-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S drinks -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R drinks:nodejs /app/data

# Switch to non-root user
USER drinks

# Expose port (Azure Container Apps expects this)
EXPOSE 3000

# Health check - use the PORT environment variable or default to 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get(\`http://localhost:\${port}/api/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]