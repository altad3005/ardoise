FROM docker.io/library/node:26-alpine AS base
RUN npm install --global pnpm@12.8.1
WORKDIR /repo

FROM base AS build
ARG SERVICE
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile --filter "@ardoise/${SERVICE}..."
RUN pnpm --filter "@ardoise/${SERVICE}" build
RUN pnpm --filter "@ardoise/${SERVICE}" deploy --prod --legacy /out \
 && cp -r "apps/${SERVICE}/dist" "apps/${SERVICE}/prisma" "apps/${SERVICE}/prisma.config.ts" /out/

FROM docker.io/library/node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
