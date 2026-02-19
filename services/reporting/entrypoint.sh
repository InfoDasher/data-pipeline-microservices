#!/bin/sh
set -e

echo "Starting reporting service..."
node services/reporting/dist/index.js
