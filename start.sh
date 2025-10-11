#!/bin/bash

echo "Starting EasyGestion project with Docker..."

# Check if docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
else
    echo "Docker is installed."
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose is not available. Please install docker-compose."
    exit 1
else
    echo "docker-compose is available."
fi

# Start with docker-compose
echo "Building and starting services with docker-compose..."
docker-compose up --build
