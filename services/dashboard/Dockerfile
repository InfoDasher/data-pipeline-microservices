FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY services/dashboard/package.json ./services/dashboard/
COPY package.json package-lock.json* ./

RUN npm install --workspace=@mono/dashboard --include-workspace-root

# Copy source
COPY services/dashboard ./services/dashboard

# Build
ARG NEXT_PUBLIC_INGESTION_URL=http://localhost:3001
ARG NEXT_PUBLIC_TRANSFORMATION_URL=http://localhost:3002
ARG NEXT_PUBLIC_REPORTING_URL=http://localhost:3003

ENV NEXT_PUBLIC_INGESTION_URL=$NEXT_PUBLIC_INGESTION_URL
ENV NEXT_PUBLIC_TRANSFORMATION_URL=$NEXT_PUBLIC_TRANSFORMATION_URL
ENV NEXT_PUBLIC_REPORTING_URL=$NEXT_PUBLIC_REPORTING_URL

RUN npm run build --workspace=@mono/dashboard

# Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/services/dashboard/.next/standalone ./
COPY --from=base /app/services/dashboard/.next/static ./services/dashboard/.next/static
COPY --from=base /app/services/dashboard/public ./services/dashboard/public

EXPOSE 3000

CMD ["node", "services/dashboard/server.js"]
