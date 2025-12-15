# Unified Dockerfile for Worktree-Forms
# Builds both Frontend and Backend and runs them with PM2

# ==========================================
# Stage 1: Base & Dependencies
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

# ==========================================
# Stage 2: Builder
# ==========================================
FROM base AS builder
# Copy root package files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy source code
COPY . .

# Build Backend
RUN npm run build -w apps/backend

# Build Frontend
# Set NEXT_PUBLIC_API_URL for build time if needed, or rely on runtime env
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build -w apps/frontend

# ==========================================
# Stage 3: Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy necessary files for Backend
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy necessary files for Frontend (Next.js Standalone mode is preferred but simplified here)
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Copy PM2 config
COPY ecosystem.config.js .

# Expose ports
EXPOSE 3000 5000

# Start both services
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
