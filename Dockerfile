# ============================================================
# Multi-stage Dockerfile for BBS GuT Rideshare (Mitfahrzentrale)
# ============================================================

# Stage 1: Build Frontend and Server
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend and bundled server (dist/server.cjs)
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application & SQL schema from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./schema.sql
COPY --from=builder /app/.env.example ./.env.example

# Expose web server port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/server.cjs"]
