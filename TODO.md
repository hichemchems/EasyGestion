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

## 7. Verification Steps for CRUD Operations and Creation Forms
To ensure all CRUD operations and creation forms are properly parameterized with correct information and linked to the database, perform the following verification steps. These steps cover backend routes, frontend forms, database connections, and end-to-end functionality.

### Backend Route Verification
- [ ] **Admin Routes** (`backend/routes/admin.js`):
  - [ ] POST /api/v1/admin: Verify creates admin user with name, email, siret, phone, password, logo. Check validation (e.g., password strength, SIRET length). Ensure data is saved to database (Admin model).
  - [ ] GET /api/v1/admin: Verify retrieves admin data correctly.
  - [ ] PUT /api/v1/admin/:id: Verify updates admin data.
  - [ ] DELETE /api/v1/admin/:id: Verify deletes admin data.
- [ ] **Auth Routes** (`backend/routes/auth.js`):
  - [ ] POST /api/v1/auth/login: Verify login with email/password, returns JWT token.
  - [ ] POST /api/v1/auth/register: Verify user registration.
  - [ ] GET /api/v1/auth/me: Verify retrieves current user data.
- [ ] **Users Routes** (`backend/routes/users.js`):
  - [ ] GET /api/v1/users: Verify lists all users.
  - [ ] POST /api/v1/users: Verify creates new user.
  - [ ] GET /api/v1/users/:id: Verify retrieves specific user.
  - [ ] PUT /api/v1/users/:id: Verify updates user.
  - [ ] DELETE /api/v1/users/:id: Verify deletes user.
- [ ] **Employees Routes** (`backend/routes/employees.js`):
  - [ ] GET /api/v1/employees: Verify lists employees.
  - [ ] POST /api/v1/employees: Verify creates employee with correct fields (name, email, etc.).
  - [ ] GET /api/v1/employees/:id: Verify retrieves employee.
  - [ ] PUT /api/v1/employees/:id: Verify updates employee.
  - [ ] DELETE /api/v1/employees/:id: Verify deletes employee.
- [ ] **Packages Routes** (`backend/routes/packages.js`):
  - [ ] GET /api/v1/packages: Verify lists packages.
  - [ ] POST /api/v1/packages: Verify creates package.
  - [ ] GET /api/v1/packages/:id: Verify retrieves package.
  - [ ] PUT /api/v1/packages/:id: Verify updates package.
  - [ ] DELETE /api/v1/packages/:id: Verify deletes package.
- [ ] **Receipts Routes** (`backend/routes/receipts.js`):
  - [ ] GET /api/v1/receipts: Verify lists receipts.
  - [ ] POST /api/v1/receipts: Verify creates receipt, emits socket event.
  - [ ] GET /api/v1/receipts/:id: Verify retrieves receipt.
  - [ ] PUT /api/v1/receipts/:id: Verify updates receipt.
  - [ ] DELETE /api/v1/receipts/:id: Verify deletes receipt.
- [ ] **Expenses Routes** (`backend/routes/expenses.js`):
  - [ ] GET /api/v1/expenses: Verify lists expenses.
  - [ ] POST /api/v1/expenses: Verify creates expense.
  - [ ] GET /api/v1/expenses/:id: Verify retrieves expense.
  - [ ] PUT /api/v1/expenses/:id: Verify updates expense.
  - [ ] DELETE /api/v1/expenses/:id: Verify deletes expense.
- [ ] **AdminCharges Routes** (`backend/routes/adminCharges.js`):
  - [ ] GET /api/v1/adminCharges: Verify lists admin charges.
  - [ ] POST /api/v1/adminCharges: Verify creates admin charge.
  - [ ] GET /api/v1/adminCharges/:id: Verify retrieves admin charge.
  - [ ] PUT /api/v1/adminCharges/:id: Verify updates admin charge.
  - [ ] DELETE /api/v1/adminCharges/:id: Verify deletes admin charge.
- [ ] **Alerts Routes** (`backend/routes/alerts.js`):
  - [ ] GET /api/v1/alerts: Verify lists alerts.
- [ ] **Analytics Routes** (`backend/routes/analytics.js`):
  - [ ] GET /api/v1/analytics: Verify retrieves analytics data.
- [ ] **Salaries Routes** (`backend/routes/salaries.js`):
  - [ ] GET /api/v1/salaries: Verify lists salaries.
  - [ ] POST /api/v1/salaries: Verify creates salary.
  - [ ] GET /api/v1/salaries/:id: Verify retrieves salary.
  - [ ] PUT /api/v1/salaries/:id: Verify updates salary.
  - [ ] DELETE /api/v1/salaries/:id: Verify deletes salary.
- [ ] **Goals Routes** (`backend/routes/goals.js`):
  - [ ] GET /api/v1/goals: Verify lists goals with employee association.
  - [ ] POST /api/v1/goals: Verify creates goal.
  - [ ] GET /api/v1/goals/:id: Verify retrieves goal.
  - [ ] PUT /api/v1/goals/:id: Verify updates goal.
  - [ ] DELETE /api/v1/goals/:id: Verify deletes goal.

### Frontend Form Verification
- [ ] **Admin Registration Form** (`frontend/src/components/Home.js`):
  - [ ] Verify form collects name, email, siret, phone, password, confirmPassword, logo.
  - [ ] Check validation matches backend (password strength, SIRET, phone).
  - [ ] Ensure FormData is sent correctly to POST /api/v1/admin.
  - [ ] Verify auto-login after registration.
- [ ] **Login Form** (check frontend components):
  - [ ] Verify collects email, password.
  - [ ] Sends to POST /api/v1/auth/login.
- [ ] **User Creation Form** (if exists):
  - [ ] Verify fields match User model.
  - [ ] Sends to POST /api/v1/users.
- [ ] **Employee Creation Form** (if exists):
  - [ ] Verify fields match Employee model.
  - [ ] Sends to POST /api/v1/employees.
- [ ] **Package Creation Form** (if exists):
  - [ ] Verify fields match Package model.
  - [ ] Sends to POST /api/v1/packages.
- [ ] **Receipt Creation Form** (if exists):
  - [ ] Verify fields match Receipt model.
  - [ ] Sends to POST /api/v1/receipts.
- [ ] **Expense Creation Form** (if exists):
  - [ ] Verify fields match Expense model.
  - [ ] Sends to POST /api/v1/expenses.
- [ ] **AdminCharge Creation Form** (if exists):
  - [ ] Verify fields match AdminCharge model.
  - [ ] Sends to POST /api/v1/adminCharges.
- [ ] **Salary Creation Form** (if exists):
  - [ ] Verify fields match Salary model.
  - [ ] Sends to POST /api/v1/salaries.
- [ ] **Goal Creation Form** (if exists):
  - [ ] Verify fields match Goal model, includes employee_id.
  - [ ] Sends to POST /api/v1/goals.

### Database and Model Verification
- [ ] **Database Connection**: Verify Sequelize connects to MySQL database successfully (check backend logs).
- [ ] **Model Associations**: Ensure all models in `backend/models/` have correct associations (e.g., Goal belongsTo Employee).
- [ ] **Migrations and Seeds**: Verify migrations run and seed data is inserted correctly.
- [ ] **Data Integrity**: For each CRUD, check that data is correctly saved/retrieved from database tables.

### End-to-End Testing
- [ ] **API Testing**: Use curl or Postman to test each endpoint with valid/invalid data.
- [ ] **Frontend Testing**: Use browser to test forms, ensure no errors in console, data persists.
- [ ] **Socket.IO**: For receipts, verify real-time updates work.
- [ ] **Authentication**: Ensure protected routes require JWT.
- [ ] **Error Handling**: Verify proper error responses for invalid data.

### General Checks
- [ ] **CORS**: Ensure all routes allow requests from frontend origin.
- [ ] **Validation**: Backend validation matches frontend.
- [ ] **File Uploads**: For forms with files (e.g., logo), verify multer handles uploads correctly.
- [ ] **Scheduler**: Verify daily alert job runs without errors.

### Testing Options and Execution
- [ ] Decide on testing level: Proceed with critical-path testing (key elements only, like admin creation and main CRUD).
- [ ] **Critical-Path Testing Steps**:
  - [ ] Test Admin Registration: POST /api/v1/admin with valid data, verify DB save, auto-login.
  - [ ] Test Admin CRUD: GET, PUT, DELETE /api/v1/admin.
  - [ ] Test Auth: Login with created admin, verify JWT.
  - [ ] Test Main Entities CRUD: Users, Employees, Packages, Receipts, Expenses, Salaries, Goals (POST, GET, PUT, DELETE for each).
  - [ ] Test Frontend Forms: Admin registration form, login form, and any creation forms for main entities.
  - [ ] Test Database Links: Verify data persistence and associations (e.g., Goals with Employees).
  - [ ] Test End-to-End: Browser test for admin creation flow, API calls via curl.

## 8. Add Confirm Password Validation to Admin Registration
- **Change**: Update `backend/routes/admin.js` to add validation for the 'confirmPassword' field in the admin registration endpoint. Add a custom validator to ensure 'confirmPassword' matches 'password' before hashing and saving the user.
- **Why**: The curl command includes 'confirmPassword', but the backend currently ignores it, which could lead to registration with mismatched passwords if not validated. This ensures password confirmation is enforced on the server side, improving security and user experience by preventing accidental mismatches.
- **Implementation Details**:
  - Add `body('confirmPassword').custom((value, { req }) => { if (value !== req.body.password) { throw new Error('Password confirmation does not match password'); } return true; })` to `adminRegisterValidation`.
  - No additional dependencies needed; uses existing express-validator.
- **Verification**: Test POST /api/v1/admin with matching and non-matching passwords to ensure validation works.
