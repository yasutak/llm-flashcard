# Development Guide

This document provides information on how to properly run and develop this application.

## Starting the Development Servers

The application consists of two parts:
- A Next.js frontend (runs on port 3000 by default)
- A Cloudflare Workers backend (runs on port 8787)

### Recommended Method

Use the following command to start both servers with proper dependency handling:

```bash
npm run dev:with-backend
```

This script will:
1. Check if the backend server is already running
2. Start it in a new terminal window if it's not running
3. Wait for the backend to be ready before starting the frontend
4. Start the frontend server

### Common Issues

#### ECONNREFUSED Error

If you see errors like this:
```
Failed to proxy http://localhost:8787/api/auth/login [AggregateError: ] { code: 'ECONNREFUSED' }
```

This indicates that the frontend is running but can't connect to the backend server. This usually happens if:

1. The backend server isn't running
2. The backend server is running on a different port than expected (8787)

To fix this:
- Make sure the backend server is running
- Use the `npm run dev:with-backend` command which ensures both services are running correctly

#### Manually Starting Servers

If you need to run the servers manually:

1. Start the backend first:
   ```bash
   cd backend
   npm run dev
   ```

2. Then in a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

## Debugging

If you encounter issues with the API connection:

1. Check if the backend is running: 
   ```bash
   curl http://localhost:8787
   ```
   
2. Check the proxy configuration in `next.config.ts` to ensure it's pointing to the correct backend URL

3. Verify that port 8787 is not already in use by another application
