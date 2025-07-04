# Multi-stage Docker build for NXD Platform
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --only=production

# Copy backend source
COPY server/ ./server/
COPY shared/ ./shared/
COPY contracts/ ./contracts/
COPY hardhat.config.ts ./

# Stage 3: Production image
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    tini \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nxd -u 1001

WORKDIR /app

# Copy built assets from previous stages
COPY --from=frontend-builder --chown=nxd:nodejs /app/dist/public ./dist/public
COPY --from=backend-builder --chown=nxd:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nxd:nodejs /app/server ./server
COPY --from=backend-builder --chown=nxd:nodejs /app/shared ./shared
COPY --from=backend-builder --chown=nxd:nodejs /app/contracts ./contracts
COPY --from=backend-builder --chown=nxd:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p logs uploads cache && chown -R nxd:nodejs logs uploads cache

# Switch to non-root user
USER nxd

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Expose port
EXPOSE 5000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server/index.js"]