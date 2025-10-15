#!/bin/bash

echo "Starting EasyGestion project..."

# Check if docker is installed and daemon is running
if command -v docker >/dev/null 2>&1 && command -v docker-compose >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "Docker and docker-compose are available. Starting with Docker..."

    # Start with docker-compose
    echo "Building and starting services with docker-compose..."
    docker-compose up --build
else
    echo "Docker not available or not preferred. Starting locally..."

    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js is not installed. Please install Node.js first."
        exit 1
    else
        echo "Node.js is installed."
    fi

    # Check if npm is installed
    if ! command -v npm >/dev/null 2>&1; then
        echo "npm is not installed. Please install npm."
        exit 1
    else
        echo "npm is available."
    fi

    # Go to backend directory and install dependencies if needed
    echo "Setting up backend..."
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi

    # Run database migrations and seed users
    echo "Running database migrations..."
    npx sequelize-cli db:migrate

    echo "Seeding users..."
    node seed-users.js

    # Start backend in background
    echo "Starting backend server..."
    npm start &
    BACKEND_PID=$!

    # Wait a moment for backend to start
    sleep 3

    # Go back to root directory
    cd ..

    # Go to frontend directory and install dependencies if needed
    echo "Setting up frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    # Start frontend in background
    echo "Starting frontend server..."
    npm start &
    FRONTEND_PID=$!

    # Go back to root directory
    cd ..

    echo "EasyGestion is running!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:5001"
    echo ""
    echo "Login credentials:"
    echo "SuperAdmin - Email: superadmin@gmail.com, Password: Admin123456789!"
    echo "Admin - Email: admin@gmail.com, Password: Admin123456789!"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for background processes
    wait $BACKEND_PID $FRONTEND_PID
fi
