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

# Signal to next.config.js to skip TS type checking (runs in CI)
ENV DOCKER_BUILD=1

# Build backend TypeScript
RUN npm run build -w apps/backend

# Build Next.js frontend (standalone mode — traces only needed deps)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}
# Cache .next/cache across builds for faster incremental compilation
RUN --mount=type=cache,target=/app/apps/frontend/.next/cache \
    npm run build -w apps/frontend

# Prune devDependencies for smaller production image
RUN npm prune --production --ignore-scripts

# ==========================================
# Stage 4: Production runtime (ECS Fargate)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

# Frontend: Next.js standalone output (preserves original paths so embedded
# absolute requires like cacheHandler resolve correctly at runtime)
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Backend: compiled dist + production node_modules (overlays standalone's traced deps)
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Startup script
COPY start.sh .
RUN chmod +x start.sh

RUN chown -R appuser:nodejs /app
USER appuser

EXPOSE 3005 5005

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://0.0.0.0:${BACKEND_PORT:-5005}/api/health || exit 1

CMD ["./start.sh"]
