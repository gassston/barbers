FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ─── Dev stage ───────────────────────────────────────────────────────────────
FROM base AS dev
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/web --workspace=packages/shared
COPY apps/web ./apps/web/
COPY packages/shared ./packages/shared/
COPY tsconfig.base.json ./
WORKDIR /app/apps/web
CMD ["npm", "run", "dev"]

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/web --workspace=packages/shared
COPY apps/web ./apps/web/
COPY packages/shared ./packages/shared/
COPY tsconfig.base.json ./
RUN npm run build -w packages/shared
WORKDIR /app/apps/web
RUN npm run build

# ─── Production stage ────────────────────────────────────────────────────────
FROM base AS prod
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
WORKDIR /app/apps/web
CMD ["node", "server.js"]
