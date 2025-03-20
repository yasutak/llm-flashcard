#!/bin/bash

# Define backend port
BACKEND_PORT=8787

# Check if backend is already running
if nc -z localhost $BACKEND_PORT 2>/dev/null; then
  echo "✅ Backend server is already running on port $BACKEND_PORT"
else
  echo "🚀 Starting backend server..."
  # Start backend in a new terminal window/tab
  osascript -e 'tell app "Terminal" to do script "cd '$PWD'/backend && npm run dev"' || \
  gnome-terminal -- bash -c "cd $PWD/backend && npm run dev" || \
  xterm -e "cd $PWD/backend && npm run dev" || \
  (cd backend && npm run dev &)
  
  # Wait for backend to start
  echo "⏳ Waiting for backend to start on port $BACKEND_PORT..."
  for i in {1..30}; do
    if nc -z localhost $BACKEND_PORT 2>/dev/null; then
      echo "✅ Backend server started successfully"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "❌ Backend server failed to start within 30 seconds"
      echo "🔍 Try starting it manually with: cd backend && npm run dev"
    fi
    sleep 1
  done
fi

# Start frontend server
echo "🚀 Starting frontend server..."
npm run dev
