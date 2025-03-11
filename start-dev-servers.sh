#!/bin/bash

# Start both frontend and backend servers

# Start the backend server in the background
cd backend
npm run dev &
BACKEND_PID=$!

# Go back to the root directory
cd ..

# Start the frontend server
npm run dev

# When the frontend server is stopped, also stop the backend server
kill $BACKEND_PID
