# =============================================================================
# Affiliate System Frontend - Multi-stage Docker Build
#
# With Better Auth + API proxy, NO build-time env vars are needed!
# All configuration is done at runtime via environment variables.
# =============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time placeholders for Better Auth (overridden at runtime via K8s secrets)
# These are needed to pass build-time validation but won't be used
ENV BETTER_AUTH_SECRET="build-time-placeholder"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV DATABASE_URL="postgres://placeholder:placeholder@localhost:5432/placeholder"

# Reduce workers to conserve memory during build
ENV NEXT_BUILD_WORKERS=2
# Increase Node.js heap size for build
ENV NODE_OPTIONS="--max-old-space-size=2048"
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
