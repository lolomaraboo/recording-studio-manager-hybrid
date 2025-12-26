# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/server ./packages/server
COPY tsconfig.json ./

# Build packages in order
RUN pnpm --filter @rsm/shared build

# Build database and show full output
RUN pnpm --filter @rsm/database build 2>&1

# Debug: List exactly what's in dist
RUN echo "=== dist/ contents ===" && ls -la /app/packages/database/dist/
RUN echo "=== dist/master/ contents ===" && ls -la /app/packages/database/dist/master/
RUN echo "=== Searching for .d.ts ===" && find /app/packages/database/dist -name "*.d.ts" || echo "NO .d.ts FILES FOUND"

RUN pnpm --filter @rsm/server build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/drizzle ./packages/database/drizzle

# Copy server source code (uses tsx, no build step)
COPY --from=builder /app/packages/server/src ./packages/server/src
COPY --from=builder /app/packages/server/tsconfig.json ./packages/server/

# Copy package.json files for workspace resolution
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/server/package.json ./packages/server/

EXPOSE 3000

CMD ["pnpm", "--filter", "@rsm/server", "start"]
