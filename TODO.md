# Thorough Testing Plan for EasyGestion App

## 1. Verify Docker Setup
- [x] Check if all containers are running (backend, frontend, db)
- [x] Confirm port mappings (backend:5001, frontend:3000)
- [ ] Check container logs for errors

## 2. Backend API Testing (using curl)
- [ ] Auth endpoints: POST /api/v1/auth/login (test with seeded users)
- [ ] Admin endpoints: POST /api/v1/admin (create admin with multipart/form-data), GET /api/v1/admin (list), etc.
- [ ] Users endpoints: CRUD operations
- [ ] Employees endpoints: CRUD operations (with file uploads)
- [ ] Packages endpoints: CRUD operations
- [ ] Sales/Receipts endpoints: CRUD operations
- [ ] Expenses endpoints: CRUD operations
- [ ] Salaries endpoints: CRUD operations
- [ ] Analytics endpoints: Turnover, sales data
- [ ] Goals endpoints: CRUD operations
- [ ] Alerts endpoints: CRUD operations
- [ ] AdminCharges endpoints: CRUD operations
- [ ] Edge cases: Invalid data, missing fields, unauthorized access, file upload failures

## 3. Frontend UI Testing (using browser)
- [ ] Launch browser at localhost:3000
- [ ] Test login page with seeded credentials
- [ ] Test admin dashboard: View analytics, create admin form
- [ ] Test user dashboard: View data
- [ ] Test forms: Create employee (with file), package, expense, receipt, salary
- [ ] Test navigation and data display
- [ ] Edge cases: Invalid inputs, error messages

## 4. Database and Integration Testing
- [ ] Verify seeded users exist (superadmin, admin)
- [ ] Check data integrity after API calls
- [ ] Ensure frontend-backend integration (data flows correctly)

## 5. Report Findings and Fixes
- [ ] Document any bugs or issues found
- [ ] Suggest fixes if needed

## 6. Deployment and Setup Tasks
- [x] Update start.sh to:
  - Start Docker if not running
  - Install backend dependencies (npm install)
  - Install frontend dependencies (npm install)
  - Run database migrations
  - Start Docker containers (backend, frontend, db)
- [x] Verify all ports used and declared correctly in docker-compose.yml and code
- [x] Verify backend methods, syntax, and implementation correctness
- [x] Verify admin and user creation for account/profile setup
