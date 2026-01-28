# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS build
COPY apps/backend apps/backend
COPY packages/shared packages/shared
WORKDIR /app/apps/backend
RUN pnpm install --no-frozen-lockfile --filter @uk2me/backend...
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend /app/apps/backend
EXPOSE 4000
CMD ["pnpm", "--filter", "@uk2me/backend", "start"]
