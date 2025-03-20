#!/bin/bash

# This script is deprecated, use 'npm run dev:with-backend' instead
echo "⚠️ Warning: This script is deprecated and may not properly manage the backend process."
echo "⚠️ Please use 'npm run dev:with-backend' instead for a more reliable development experience."
echo ""
echo "🚀 Starting development servers with the deprecated script..."
echo ""

# Check if backend is already running
if nc -z localhost 8787 2>/dev/null; then
  echo "✅ Backend server is already running on port 8787"
else
  # Start the backend server in the background
  echo "🚀 Starting backend server..."
  cd backend
  npm run dev &
  BACKEND_PID=$!

  # Go back to the root directory
  cd ..
  
  # Wait for backend to start
  echo "⏳ Waiting for backend to start..."
  for i in {1..30}; do
    if nc -z localhost 8787 2>/dev/null; then
      echo "✅ Backend server started successfully"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "❌ Backend server failed to start within 30 seconds"
      echo "🔍 Try using 'npm run dev:with-backend' instead"
    fi
    sleep 1
  done
fi

# Start the frontend server
echo "🚀 Starting frontend server..."
npm run dev

# When the frontend server is stopped, also stop the backend server
if [ -n "$BACKEND_PID" ]; then
  echo "🛑 Stopping backend server (PID: $BACKEND_PID)..."
  kill $BACKEND_PID 2>/dev/null || true
fi
