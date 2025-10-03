# EasyGestion - Salon Management System

## Project Overview

EasyGestion is a comprehensive web application designed for managing hair salons. It provides tools for admins to oversee operations, track finances, and manage employees, while allowing hairdressers (barbers) to record sales, receipts, and view their performance metrics. The system includes real-time analytics, package management, expense tracking, and salary calculations.

### Key Features

- **Admin Dashboard**: Real-time monitoring of salon performance, employee management, package customization, payment tracking, and analytics with charts and forecasts.
- **Barber Dashboard**: Package selection for clients, receipt entry, personal statistics, and revenue tracking.
- **Package Management**: Predefined services with customizable prices, automatic revenue calculation.
- **Real-time Analytics**: Daily turnover, average basket, client count, forecasts with progress percentages.
- **Financial Management**: Expense tracking, salary calculations based on commissions, profit analysis.
- **Security**: JWT authentication, role-based access control, input validation, CSRF protection.

### Architecture

- **Backend**: Node.js with Express.js, Sequelize ORM, MySQL database.
- **Frontend**: React with Material-UI, responsive mobile-first design.
- **Real-time**: Socket.io for live updates.
- **Deployment**: Dockerized with Nginx reverse proxy.

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- MySQL (v8+)
- Docker (optional for deployment)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd easygestion
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Database Setup**:
   - Create a MySQL database named `easygestion`
   - Run migrations and seeders as above

### Environment Variables

Create a `.env` file in the backend directory:

```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=easygestion
JWT_SECRET=your_jwt_secret
PORT=5000
```

## API Documentation

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh JWT token

### Admin Endpoints

- `POST /api/v1/admins` - Create admin account
- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create barber with avatar and documents
- `GET /api/v1/packages` - Get all packages
- `POST /api/v1/packages` - Create package
- `GET /api/v1/admin/dashboard/sorted-barbers` - Get barbers sorted by turnover
- `GET /api/v1/analytics/realtime-daily-turnover` - Real-time daily turnover

### Barber Endpoints

- `GET /api/v1/employees/:id/sales` - Get barber's sales
- `POST /api/v1/employees/:id/sales` - Create sale from package
- `GET /api/v1/employees/:id/receipts` - Get barber's receipts
- `POST /api/v1/employees/:id/receipts` - Add receipt

### Analytics

- `GET /api/v1/analytics/daily-turnover` - Daily turnover
- `GET /api/v1/analytics/forecast` - Turnover forecast with percentage

## Usage Guide

### For Admins

1. Register as admin on the homepage.
2. Create barber accounts with photos and documents.
3. Customize packages and prices.
4. Monitor real-time dashboard with charts and alerts.
5. Manage expenses and view profit analysis.

### For Barbers

1. Login to your dashboard.
2. Select packages for clients to auto-generate prices.
3. Enter receipts manually if needed.
4. View your daily, weekly, monthly metrics.

## Development

### Running Tests

```bash
cd backend
npm test

cd frontend
npm test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
cd frontend
npm run build

cd backend
npm run build
```

## Deployment

Use Docker for deployment:

```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@easygestion.com or create an issue in the repository.
