#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=services/transformation/prisma/schema.prisma

echo "Starting transformation service..."
node services/transformation/dist/index.js
