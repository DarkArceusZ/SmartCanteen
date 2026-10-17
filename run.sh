#!/usr/bin/env bash

echo "========================================================"
echo "       SmartCanteen AI - Starting Services"
echo "========================================================"

if [ ! -f .env.local ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
fi

echo "[1/2] Starting local MongoDB instance..."
node scripts/start-db.mjs &
MONGO_PID=$!

echo "[2/2] Starting Next.js Web Application..."
pnpm play &
NEXT_PID=$!

echo "SmartCanteen AI is running at http://localhost:3000"

cleanup() {
    echo "Stopping services..."
    kill $MONGO_PID $NEXT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM
wait

