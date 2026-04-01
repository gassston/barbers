FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ─── Dev stage ───────────────────────────────────────────────────────────────
FROM base AS dev
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/
RUN npm install --workspace=apps/api --workspace=packages/shared
COPY apps/api ./apps/api/
COPY packages/shared ./packages/shared/
COPY tsconfig.base.json ./
ENV PATH="/app/node_modules/.bin:${PATH}"
WORKDIR /app/apps/api
CMD ["tsx", "watch", "src/index.ts"]

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS builder
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/api --workspace=packages/shared
COPY apps/api ./apps/api/
COPY packages/shared ./packages/shared/
COPY tsconfig.base.json ./
COPY prisma ./prisma/
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

# ─── Production stage ────────────────────────────────────────────────────────
FROM base AS prod
ENV NODE_ENV=production
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/
RUN npm install --workspace=apps/api --workspace=packages/shared --omit=dev
RUN npx prisma generate --schema=prisma/schema.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
