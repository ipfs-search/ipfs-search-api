# syntax = docker/dockerfile:1.2
FROM node:16-alpine as base
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/server/package.json ./packages/server/

FROM base as build
RUN --mount=type=cache,target=/root/.npm npx lerna bootstrap --ci --scope=@ipfs-search/api-server --include-dependencies

# Build server
COPY packages/ ./packages/
RUN npx lerna run build --scope=@ipfs-search/api-server --include-dependencies

# Slim run-time stage
FROM base

COPY --from=build /app/packages/types/dist/ ./packages/types/dist/
COPY --from=build /app/packages/server/dist/ ./packages/server/dist/

WORKDIR /app/packages/server

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Start server
USER node:node
EXPOSE 9615
CMD ["npm", "start"]
