#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=services/ingestion/prisma/schema.prisma

echo "Starting ingestion service..."
node services/ingestion/dist/index.js
