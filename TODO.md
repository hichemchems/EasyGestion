# TODO List for EasyGestion API Development (Prioritized by Importance and Logical Order)

## Phase 1: Foundation (Most Critical - Start Here)
### 1. Project Setup and Structure
- [ ] Initialize the project directory structure (backend and frontend folders)
- [ ] Set up version control (Git repository)
- [ ] Create comprehensive README.md with project overview, setup instructions, API documentation, and usage guide
- [ ] Define project architecture (backend API + React frontend)

### 2. Database Setup (MySQL)
- [x] Design database schema:
  - Users table (id, username, email, password_hash, role, created_at, updated_at)
  - Employees table (id, user_id, name, position, hire_date, deduction_percentage)
  - Packages table (id, name, price, is_active, created_at, updated_at) - predefined packages customizable by admin
  - Sales table (id, employee_id, package_id, client_name, amount, date, description) - tracks package sales
  - Receipts table (id, employee_id, client_name, amount, date, description)
  - Expenses table (id, category, amount, date, description, created_by)
  - Salaries table (id, employee_id, base_salary, commission_percentage, total_salary, period_start, period_end)
- [x] Set up Sequelize models and associations
- [x] Create database migrations
- [x] Implement database connection and error handling
- [x] Seed initial packages: Barbe (7€), Coupe de cheveux (12€), Coupe de cheveux sans contour (16€), Coupe de cheveux avec contour (19€), Coupe de cheveux enfant (10€), and add 6th package as needed

## Phase 2: Backend Core (Essential Infrastructure)
### 3. Backend Setup (Node.js/Express)
- [ ] Initialize Node.js project with package.json
- [ ] Install core dependencies:
  - express (web framework)
  - cors (cross-origin resource sharing)
  - helmet (security headers)
  - dotenv (environment variables)
  - sequelize (ORM for database, prevents SQL injection)
  - mysql2 (MySQL driver)
  - bcryptjs (password hashing)
  - jsonwebtoken (JWT authentication)
  - express-rate-limit (rate limiting)
  - express-validator (input validation)
  - csurf (CSRF protection)
  - cookie-parser (cookie handling)
  - express-fileupload (file uploads)
  - socket.io (real-time updates for receipts)
  - nodemailer (email notifications if needed)
- [ ] Set up Express server with basic middleware
- [ ] Configure environment variables (.env file)
- [ ] Implement API versioning (e.g., /api/v1/ prefix for all endpoints)

### 4. Authentication and Authorization
- [ ] Implement user registration with password validation (14+ chars, uppercase, symbols)
- [ ] Implement login with JWT token generation
- [ ] Create middleware for authentication (verify JWT)
- [ ] Implement role-based access control (superAdmin, admin, user/barber)
- [ ] Set up password hashing with bcrypt
- [ ] Implement password reset functionality
- [ ] Add session management with secure cookies

### 5. Security Implementations
- [ ] Prevent SQL injection (use Sequelize ORM)
- [ ] Prevent XSS attacks (input sanitization with express-validator)
- [ ] Implement CSRF protection (csurf middleware)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement input validation and sanitization
- [ ] Set up HTTPS (in production)
- [ ] Add security headers (helmet)
- [ ] Implement logging and monitoring

## Phase 3: Core API Functionality (Business Logic)
### 6. Basic API Endpoints Development
- [ ] Authentication endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/refresh-token
- [ ] Admin creation endpoint (homepage):
  - POST /api/admins (with logo upload, validation for email, siret 14 digits, phone, password constraints)
- [ ] User management endpoints (admin/superAdmin):
  - GET /api/users
  - POST /api/users (create barber with avatar photo upload and document uploads: contract, employment declaration, certification)
  - PUT /api/users/:id
  - PUT /api/employees/:id/deduction-percentage (set/change deduction percentage for employee)
  - DELETE /api/users/:id

### 7. Package and Sales API (Core Feature)
- [ ] Package management endpoints (admin):
  - GET /api/packages (get all active packages)
  - POST /api/packages (create new package)
  - PUT /api/packages/:id (update package)
  - DELETE /api/packages/:id (deactivate package)
- [ ] Sales endpoints (users/barbers):
  - GET /api/employees/:id/sales (get sales for employee)
  - POST /api/employees/:id/sales (create sale from package selection)
  - PUT /api/employees/:id/sales/:saleId
  - DELETE /api/employees/:id/sales/:saleId

### 8. Business Logic Implementation
- [ ] Implement package selection and sales creation (auto-generate price from selected package)
- [ ] Implement receipt entry and validation
- [ ] Create turnover calculation functions (daily/weekly/monthly/annual, including monthly evolution over time) - include sales in turnover
- [ ] Implement expense tracking and categorization
- [ ] Develop profit calculation (turnover - expenses)
- [ ] Build automatic salary generation based on commission structure (include sales commissions)
- [ ] Calculate remaining revenue (monthly receipts and sales minus percentage charges for each barber)
- [ ] Implement admin charge data input form accessible from dashboard button "Personnaliser Charge"
- [ ] Allow admin to input and customize charges: rent, charges, operating costs, electricity, salaries
- [ ] Calculate turnover, profit, and forecast objectives considering admin charges
- [ ] Implement daily alert at 9 AM with daily/monthly objectives and remaining amount to reach goals
- [ ] Implement carry-over of unmet goals distributed equally among remaining days and barbers
- [ ] Calculate salaries based on individual barber turnover minus charges, divided by days worked (salon closed Sundays)

## Phase 4: Advanced API Features
### 9. Analytics and Dashboard API
- [ ] Employee dashboard endpoints:
  - GET /api/employees/:id/receipts (get receipts for employee)
  - POST /api/employees/:id/receipts (add daily receipt)
  - PUT /api/employees/:id/receipts/:receiptId
  - DELETE /api/employees/:id/receipts/:receiptId
- [ ] Admin dashboard endpoints:
  - GET /api/admin/dashboard/sorted-barbers (get barbers sorted by turnover descending)
  - GET /api/admin/dashboard/realtime-charts (get real-time turnover charts for day, month, year)
  - GET /api/admin/dashboard/forecast (get turnover forecast with percentage progress)
- [ ] Turnover and analytics endpoints:
  - GET /api/analytics/daily-turnover
  - GET /api/analytics/weekly-turnover
  - GET /api/analytics/monthly-turnover (cumulative since start of month)
  - GET /api/analytics/monthly-evolution (turnover, expenses, profit month by month)
  - GET /api/analytics/annual-turnover (day by day and month by month)
  - GET /api/analytics/profit (after expenses)
  - GET /api/analytics/realtime-daily-turnover (current day turnover in real-time)
  - GET /api/analytics/realtime-average-basket (daily average basket per client)
  - GET /api/analytics/realtime-client-count (total clients served by all barbers today)
  - GET /api/analytics/forecast (turnover forecast with percentage towards annual objective)
  - GET /api/employees/:id/remaining-revenue (current month receipts and sales minus percentage charges)
- [ ] Expense management endpoints:
  - GET /api/expenses
  - POST /api/expenses
  - PUT /api/expenses/:id
  - DELETE /api/expenses/:id
- [ ] Admin charge management endpoints:
  - GET /api/admin/charges (get current charges)
  - POST /api/admin/charges (create/update charges)
  - GET /api/admin/charges/alerts (get daily alerts with objectives and remaining amounts)
- [ ] Salary calculation endpoints:
  - GET /api/salaries/:employeeId
  - POST /api/salaries/generate (automatic calculation based on receipts and sales)
- [ ] Add data aggregation and reporting features
- [ ] Implement real-time receipt and sales updates using Socket.io for admin dashboard
- [ ] Implement real-time analytics: daily turnover, average basket, client count, forecast with percentage progress
- [ ] Sort barbers by turnover for admin dashboard
- [ ] Generate real-time charts for day, month, year turnover

## Phase 5: Frontend Development (User Interface)
### 10. Frontend Setup (React)
- [ ] Initialize React application
- [ ] Install frontend dependencies:
  - react-router-dom (routing)
  - axios (HTTP client)
  - redux or context API (state management)
  - material-ui or bootstrap (UI components with mobile-first responsive design)
  - react-hook-form (form handling)
  - jwt-decode (token decoding)
  - chart.js or recharts (charts for analytics)
  - react-dropzone (file uploads)
- [ ] Set up CSS variables for consistent styling across the app
- [ ] Create reusable button components: submit button, cancel button, category buttons with unique CSS
- [ ] Set up routing with protected routes
- [ ] Create login/register components with mobile-first responsive UI
- [ ] Build homepage with admin creation button and form (logo upload, name, email validation/confirmation, siret 14 digits, address, postal code, city, phone, password constraints/confirmation with indications) optimized for mobile
- [ ] Build admin dashboard: welcome message "Bonjour admin.prenom", for mobile, top aligned center, buttons in column with icons and text: 1. Mes employers (cards in grid-template-column 1fr 1fr, bottom button to add employer), 2. Service (personalize services and prices), 3. Mes mode de paiement (choose payment after service: cash, card, view collected payments in cash/card and distribution by hairdresser), 4. Statistiques (graphs turnover/forecast/objective with progress bars and percentages), logout button at bottom in yellow, and for desktop: grid of cards for each barber sorted by turnover descending, showing real-time daily receipts, weekly receipts, cumulative monthly receipts, and remaining revenue (monthly receipts and sales minus percentage charges), with option to edit deduction percentage for each barber, real-time indicators for average basket, client count, daily turnover, forecast percentage, and below cards real-time charts for day/month/year turnover, designed mobile-first
- [ ] Add button in admin dashboard to create user (barber) with form: avatar photo upload, name, email validation/confirmation, document uploads (contract, employment declaration, certification), password constraints/confirmation, mobile optimized
- [ ] Build user (barber) dashboard: for mobile, logo at top, welcome message "Bonjour user.prenom", buttons with icons and text: 1. Access packages for client selection (choose from 6 packages with auto price generation and revenue calculation), 2. Access his statistics (real-time daily turnover, objective, salary after admin charges deduction), logout button at bottom in yellow, and for desktop: card showing their own metrics (daily, weekly, monthly receipts and sales, remaining revenue), package selection interface, mobile-first design
- [ ] Implement employee receipt entry forms with responsive layout
- [ ] Create analytics views with charts optimized for mobile
- [ ] Add expense management interface with mobile responsiveness
- [ ] Implement salary viewing components with mobile-first UI

## Phase 6: Testing and Quality Assurance
### 11. Testing and Quality Assurance (Critical-Path Testing Focus)
- [ ] Write unit tests for backend (Jest) - focus on key business logic
- [ ] Write integration tests for primary API endpoints (user management, receipts, analytics)
- [ ] Test authentication and authorization (key security features)
- [ ] Test security vulnerabilities (OWASP top 10) - critical issues only
- [ ] Perform frontend testing (React Testing Library) - focus on admin and user dashboards
- [ ] Test Docker containers
- [ ] Add linting and code formatting (ESLint, Prettier)

## Phase 7: Deployment and Infrastructure
### 12. Dockerization
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Set up docker-compose.yml with services:
  - MySQL database
  - Backend API
  - Frontend React app
  - Nginx (reverse proxy)
- [ ] Configure environment variables for Docker
- [ ] Add Docker ignore files

### 13. Deployment and Production Setup
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure production environment
- [ ] Set up database backups
- [ ] Implement monitoring and logging
- [ ] Add error handling and reporting
- [ ] Optimize performance (caching, database indexing)

## Phase 8: Documentation and Finalization (Least Urgent)
### 14. Documentation and Final Touches
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Write user manuals for different roles
- [ ] Add code comments and documentation
- [ ] Perform final security audit
- [ ] Test end-to-end user workflows
- [ ] Prepare deployment scripts

## Dependencies Summary
### Backend Dependencies:
- express, cors, helmet, dotenv, bcryptjs, jsonwebtoken, express-rate-limit, express-validator, csurf, cookie-parser, sequelize, mysql2, express-fileupload, nodemailer

### Frontend Dependencies:
- react, react-dom, react-router-dom, axios, redux, material-ui, react-hook-form, jwt-decode, chart.js, react-webcam (for photo capture)

### Dev Dependencies:
- nodemon, jest, supertest, eslint, prettier, concurrently

### Database:
- MySQL

### Infrastructure:
- Docker, docker-compose, nginx
