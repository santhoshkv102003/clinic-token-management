# Clinic Token System - Full Stack Deployment

This application is now configured as a full-stack application with a React frontend and Express.js backend.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the full-stack application (both frontend and backend):
   ```bash
   npm run dev:full
   ```

   This will start:
   - Backend server on http://localhost:3000
   - Frontend development server on http://localhost:5173

3. Or run them separately:
   ```bash
   # Backend only
   npm run server
   
   # Frontend only
   npm run dev
   ```

## Production Deployment on Render

The application is configured to deploy as a full-stack application on Render:

1. **Build Process**: 
   - Installs dependencies
   - Builds the React frontend
   - Serves the built files through Express.js

2. **Start Command**: 
   - Runs `npm start` which executes `node server.js`

3. **API Endpoints**:
   - `GET /api/queue` - Get current queue status
   - `POST /api/book-token` - Book a new token
   - `POST /api/next-number` - Advance to next number
   - `POST /api/reset-queue` - Reset the queue

4. **Static File Serving**:
   - The Express server serves the built React app from the `/dist` directory
   - All non-API routes are handled by the React router

## Environment Variables

- `NODE_ENV`: Set to "production" in Render
- `VITE_ALLOWED_HOSTS`: Configured for Render domain
- `VITE_API_BASE`: Set to empty string (uses relative paths)

## Architecture

- **Frontend**: React with Vite, TypeScript, Tailwind CSS
- **Backend**: Express.js with in-memory storage
- **State Management**: React Context with API integration
- **Deployment**: Single service on Render serving both frontend and backend

## API Integration

The frontend now communicates with the backend through REST API calls:
- Queue data is fetched from the server on app load
- Token booking, queue advancement, and reset operations are handled by the backend
- Loading states and error handling are implemented for all API calls

## Next Steps for Production

For a production environment, consider:
1. Adding a database (PostgreSQL, MongoDB) instead of in-memory storage
2. Implementing authentication and authorization
3. Adding data persistence and backup strategies
4. Setting up monitoring and logging
5. Implementing rate limiting and security measures 