#!/bin/bash
echo "Killing process on port 4000..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
echo "Starting application..."
npm start 