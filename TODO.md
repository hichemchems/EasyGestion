# TODO.md - Changes Made to EasyGestion Project

## 1. Fixed Circular Dependency in backend/routes/receipts.js
- **Change**: Removed the top-level `const { io } = require('../index');` and added lazy loading `const { io } = require('../index');` inside each route handler that uses `io.emit`.
- **Why**: There was a circular dependency between `backend/index.js` (which requires routes) and `backend/routes/receipts.js` (which required index for io). This caused a warning: "Accessing non-existent property 'io' of module exports inside circular dependency". Lazy loading ensures the module is fully loaded before accessing io.

## 2. Fixed Sequelize Association in backend/models/index.js
- **Change**: Added `as: 'employee'` to the `Goal.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });` association.
- **Why**: The scheduler in `backend/scheduler.js` was using `include: [{ model: Employee, as: 'employee' }]`, but the association was defined without the alias, causing Sequelize to expect 'Employee' (capital E) instead of 'employee'. This resulted in EagerLoadingError during the daily alert job.

## 3. Fixed Frontend API URL in docker-compose.yml
- **Change**: Changed `REACT_APP_API_URL` from `http://backend:5000/api/v1` to `http://localhost:5002/api/v1`.
- **Why**: The frontend is accessed on the host at `http://localhost:3001`, so it needs to call the backend on the host port `5002` (mapped from container port 5000). The previous URL `http://backend:5000` is only resolvable inside the Docker network, not from the host browser.

## 4. Fixed Frontend Port Consistency
- **Change**: Updated `frontend/Dockerfile` to `EXPOSE 3001`, and `docker-compose.yml` to set `PORT: 3001` and ports mapping `"3001:3001"`.
- **Why**: The frontend console was showing `http://localhost:3000` (internal container port), but the user accesses it on `http://localhost:3001` (host port). This change makes the console display the correct host port for consistency.

## 5. Fixed CORS Configuration
- **Change**: Updated `backend/index.js` to allow CORS from both `http://localhost:3000` and `http://localhost:3001` for express and socket.io.
- **Why**: The frontend is now running on port 3001, but the backend CORS was only allowing 3000, causing 404 errors on API calls.

## Note on Frontend Port
- The frontend now runs on port 3001 inside the Docker container and is mapped to the same port on the host.
- You access it at `http://localhost:3001` from your browser, and the console now correctly shows `http://localhost:3001`.
- This is configured in `docker-compose.yml` with `"3001:3001"` and `PORT: 3001`.
## 6. Fixed Admin Registration 404 Error
- **Issue**: POST request to `/api/v1/admin` was returning 404 "Route not found" due to CORS preflight failure.
- **Root Cause**: CORS configuration used an array of origins with `credentials: true`, which doesn't work for preflight OPTIONS requests. The cors package requires a function for origin validation when using credentials. Additionally, the OPTIONS preflight request was not being handled properly for the specific route, and allowedHeaders needed to be specified for multipart requests.
- **Fix Applied**: 
  - Updated CORS configuration in `backend/index.js` to use a function that checks allowed origins for both express and socket.io, and added allowedHeaders for content-type.
  - Added explicit OPTIONS handler in `backend/routes/admin.js` to respond to preflight requests.
- **Verification**: Tested endpoint with curl - POST works. Frontend should now be able to register admin successfully.
