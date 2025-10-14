# TODO: Complete Refactor of Database and Backend Configuration

## Issues Identified
- Multiple ports (5000, 5001, 5002) causing configuration conflicts
- Database configuration scattered across multiple files
- Migrations split across multiple files instead of consolidated
- CORS and network errors persisting in frontend-backend communication
- Database syntax and method declarations need verification

## Tasks to Complete

### 1. Database Refactor
- [ ] Consolidate all table migrations into a single migration file
- [ ] Verify database syntax for all models and migrations
- [ ] Ensure proper foreign keys and relationships
- [ ] Test database connection and sync

### 2. Port Configuration Fix
- [ ] Standardize port configuration across all files
- [ ] Remove conflicting port settings (5000, 5001, 5002)
- [ ] Ensure consistent port usage in backend, frontend proxy, and Docker

### 3. Backend Configuration Verification
- [ ] Verify all method declarations in routes
- [ ] Check API endpoint configurations
- [ ] Validate middleware order and settings
- [ ] Confirm environment variable usage

### 4. Docker Configuration
- [ ] Review docker-compose.yml for port conflicts
- [ ] Ensure database service configuration matches backend
- [ ] Verify environment variables in Docker setup

### 5. Frontend-Backend Integration
- [ ] Confirm proxy configuration in frontend
- [ ] Test API calls from frontend to backend
- [ ] Resolve any remaining CORS issues

### 6. Testing and Validation
- [ ] Test admin registration end-to-end
- [ ] Verify database operations
- [ ] Confirm all ports are consistent
- [ ] Validate all configurations work together

## Current Status
- Backend running on port 5001
- Frontend proxy configured for localhost:5001
- Database using SQLite locally
- Multiple migration files exist
- CORS issues with Helmet middleware order

## Next Steps
1. Start with consolidating migrations
2. Fix port configuration
3. Verify database syntax
4. Test integration
