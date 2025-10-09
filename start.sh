#!/bin/bash

echo "Starting EasyGestion project..."

# Check if npm is installed
if ! command -v npm >/dev/null 2>&1; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
else
    echo "npm is installed."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Run database migrations
echo "Running database migrations..."
cd backend
npx sequelize-cli db:migrate
cd ..

# Run database seeders
echo "Running database seeders..."
cd backend
node seed-users.js
cd ..

# Start backend
echo "Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "Project started successfully!"
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:5001"
echo "Press Ctrl+C to stop"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
