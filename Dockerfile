FROM node:16-alpine as build-base
WORKDIR /app

# Build build-base image, with lerna
COPY package.json package-lock.json lerna.json tsconfig.json ./
RUN npm ci

# Install types build dependencies
FROM build-base AS types
COPY packages/types/package.json ./packages/types/
RUN npm ci

# Build types
COPY packages/types/ ./packages/types/
RUN npx lerna run build --scope=@ipfs-search/api-types

# Install server build dependencies
FROM build-base AS server
COPY packages/server/package.json ./packages/server/
RUN npm ci

# Build server
COPY --from=types /app/packages/types/ ./packages/types/
COPY packages/server/ ./packages/server/
RUN npx lerna run build --scope=@ipfs-search/api-server

# Slim run-time stage
FROM node:16-alpine

WORKDIR /app

COPY --from=build-base /app/package-lock.json /app/package.json ./

COPY --from=server /app/packages/types/package.json ./packages/types/package.json
COPY --from=server /app/packages/types/dist/ ./packages/types/dist/
COPY --from=server /app/packages/server/package.json ./packages/server/package.json
COPY --from=server /app/packages/server/dist/ ./packages/server/dist/

WORKDIR /app/packages/server

RUN npm ci --omit=dev

# Start server
USER node:node
EXPOSE 9615
CMD ["npm", "start"]
