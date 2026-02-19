FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/reporting/package.json ./services/reporting/

# Install dependencies
RUN npm install --workspace=@mono/reporting --workspace=@mono/shared --include-workspace-root

# Copy source code
COPY packages/shared ./packages/shared
COPY services/reporting ./services/reporting
COPY tsconfig.base.json ./

# Build shared package
RUN npm run build --workspace=@mono/shared

# Generate Prisma client
RUN npx prisma generate --schema=services/reporting/prisma/schema.prisma

# Build service
RUN npm run build --workspace=@mono/reporting

EXPOSE 3003

COPY services/reporting/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
