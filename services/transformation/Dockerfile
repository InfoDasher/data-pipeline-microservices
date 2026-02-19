FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/transformation/package.json ./services/transformation/

# Install dependencies
RUN npm install --workspace=@mono/transformation --workspace=@mono/shared --include-workspace-root

# Copy source code
COPY packages/shared ./packages/shared
COPY services/transformation ./services/transformation
COPY tsconfig.base.json ./

# Build shared package
RUN npm run build --workspace=@mono/shared

# Generate Prisma client
RUN npx prisma generate --schema=services/transformation/prisma/schema.prisma

# Build service
RUN npm run build --workspace=@mono/transformation

EXPOSE 3002

COPY services/transformation/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
