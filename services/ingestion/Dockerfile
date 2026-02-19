FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/ingestion/package.json ./services/ingestion/

# Install dependencies
RUN npm install --workspace=@mono/ingestion --workspace=@mono/shared --include-workspace-root

# Copy source code
COPY packages/shared ./packages/shared
COPY services/ingestion ./services/ingestion
COPY tsconfig.base.json ./

# Build shared package
RUN npm run build --workspace=@mono/shared

# Generate Prisma client
RUN npx prisma generate --schema=services/ingestion/prisma/schema.prisma

# Build service
RUN npm run build --workspace=@mono/ingestion

EXPOSE 3001

# Copy and use entrypoint
COPY services/ingestion/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
