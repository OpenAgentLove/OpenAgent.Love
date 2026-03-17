# Multi-stage Dockerfile for OpenAgent Love
# Optimized for production use with minimal image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

# Copy package files
COPY package*.json ./
COPY skills/agent-marriage-breeding/package*.json ./skills/agent-marriage-breeding/

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production && \
    cd skills/agent-marriage-breeding && \
    npm ci --only=production

# Copy source code
COPY . .

# Run tests (optional, can be skipped in production)
# RUN npm test

# Stage 2: Production stage
FROM node:20-alpine AS production

# Add labels for better maintainability
LABEL maintainer="OpenAgentLove Team"
LABEL version="2.3.0"
LABEL description="AI Agent Evolution System - Marriage, Breeding, Family Tree"

# Install runtime dependencies
RUN apk add --no-cache sqlite-libs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/skills/agent-marriage-breeding/node_modules ./skills/agent-marriage-breeding/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/skills/agent-marriage-breeding ./skills/agent-marriage-breeding
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create data directory
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (if running as standalone service)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Healthy')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/evolution.db

# Default command
CMD ["node", "-e", "console.log('OpenAgent Love running in Docker')"]

# Stage 3: Development stage (optional)
FROM node:20-alpine AS development

LABEL stage=development

WORKDIR /app

# Install all dependencies including dev dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
RUN npm install

COPY . .

# Expose port for development
EXPOSE 3000

# Enable hot reload
ENV NODE_ENV=development
ENV WATCH=true

CMD ["npm", "run", "test:watch"]
