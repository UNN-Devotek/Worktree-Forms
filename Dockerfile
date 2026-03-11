# syntax=docker/dockerfile:1
# Unified Dockerfile for Worktree
# Local dev: uses `deps` stage (docker-compose.yml target: deps)
# Production: uses `runner` stage

# ==========================================
# Stage 1: Base & Dependencies
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install all deps with npm cache mount (persists across builds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# ==========================================
# Stage 2: Dev dependencies + source (used by docker-compose locally)
# ==========================================
FROM base AS deps
# Source already copied in base — this stage is used as-is for local dev
# docker-compose overrides CMD with: npm run dev -w apps/frontend & npm run dev -w apps/backend

# ==========================================
# Stage 3: Build for production
# ==========================================
FROM base AS builder

# Build backend TypeScript
RUN npm run build -w apps/backend

# Build Next.js frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}
# Cache .next/cache across builds for faster incremental compilation
RUN --mount=type=cache,target=/app/apps/frontend/.next/cache \
    npm run build -w apps/frontend

# ==========================================
# Stage 4: Production runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

# Copy node_modules (full — skip prune to save build time)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Backend compiled output
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Frontend build output + assets
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/next.config.js
COPY --from=builder /app/apps/frontend/lib/cache-handler.js ./apps/frontend/lib/cache-handler.js

# Startup script (strip Windows CRLF — git autocrlf can sneak them in)
COPY start.sh .
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

RUN chown -R appuser:nodejs /app
USER appuser

EXPOSE 3005 5005

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://0.0.0.0:${BACKEND_PORT:-5005}/api/health || exit 1

CMD ["./start.sh"]
