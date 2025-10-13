# Backend Refactor and Middleware Integration TODO

## Overview
Complete refactor of the backend to properly integrate middleware, fix networking issues, and ensure seamless frontend-backend communication. Focus on authentication, authorization, CORS, rate limiting, error handling, and API routing.

## Tasks

### 1. Backend Server Refactor (index.js)
- [ ] Reorganize middleware stack in correct order:
  - Helmet for security headers
  - CORS configuration (allow localhost:3000)
  - Express JSON/URL-encoded parsing
  - Cookie parser
  - Rate limiting
  - Global error handler
- [ ] Ensure proper database connection and sync
- [ ] Set server to run on port 3001 for local development
- [ ] Add Socket.io integration if needed
- [ ] Test server startup without errors

### 2. Middleware Updates
- [ ] Update middleware/auth.js:
  - [ ] Fix JWT token verification
  - [ ] Implement role-based authorization (admin, user, superAdmin)
  - [ ] Add proper error responses for unauthorized access
- [ ] Ensure all protected routes use authentication middleware
- [ ] Test middleware with sample requests

### 3. Routes Integration
- [ ] Review all route files (admin.js, auth.js, employees.js, etc.)
- [ ] Ensure admin registration route (/api/v1/admin) works with file uploads
- [ ] Add authentication middleware to protected routes
- [ ] Verify all endpoints return proper JSON responses
- [ ] Test admin registration endpoint manually

### 4. Database and Models
- [ ] Ensure Sequelize models are properly defined
- [ ] Test database connection (use Docker MySQL if local MySQL issues)
- [ ] Run migrations if needed
- [ ] Verify model relationships

### 5. Frontend Proxy and Configuration
- [ ] Update setupProxy.js to target localhost:3001
- [ ] Update AuthContext.js axios baseURL to localhost:3001
- [ ] Ensure proxy rewrites /api to /api/v1 correctly
- [ ] Test proxy configuration

### 6. CORS and Security
- [ ] Configure CORS to allow frontend origin (localhost:3000)
- [ ] Add proper CORS headers for credentials
- [ ] Ensure Helmet doesn't block necessary functionality
- [ ] Test cross-origin requests

### 7. File Upload Handling
- [ ] Ensure multer is properly configured for logo/avatar uploads
- [ ] Test file upload in admin registration
- [ ] Verify uploaded files are stored correctly

### 8. Authentication Flow Testing
- [ ] Test admin registration (frontend form submission)
- [ ] Test login functionality
- [ ] Test protected route access
- [ ] Verify JWT tokens are set in cookies

### 9. Error Handling
- [ ] Implement global error handler in backend
- [ ] Ensure frontend handles backend errors properly
- [ ] Test error scenarios (invalid data, unauthorized access)

### 10. Full Integration Test
- [ ] Start backend on port 3001
- [ ] Start frontend on port 3000
- [ ] Test complete admin registration flow
- [ ] Test login and dashboard access
- [ ] Verify no network errors or 504 timeouts

## Notes
- Backend should run locally on port 3001 for development
- Frontend proxy targets localhost:3001
- Use Docker for database if local MySQL has issues
- Do not modify TODO1.md as requested
- Focus on fixing the 504 Gateway Timeout and network errors
