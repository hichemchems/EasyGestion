#!/bin/bash

echo "Starting EasyGestion project..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Starting Docker..."
    open -a Docker
    # Wait for Docker to start
    while ! docker info >/dev/null 2>&1; do
        sleep 1
    done
    echo "Docker started."
else
    echo "Docker is already running."
fi

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

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

echo "Project started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5001"
echo "Database: localhost:3307"
