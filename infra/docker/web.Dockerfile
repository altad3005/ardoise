FROM docker.io/library/node:26-alpine AS build
RUN npm install --global pnpm@12.8.1
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile --filter "@ardoise/web..."
RUN pnpm --filter "@ardoise/web..." build

FROM docker.io/library/caddy:2-alpine AS runtime
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web/dist /srv
