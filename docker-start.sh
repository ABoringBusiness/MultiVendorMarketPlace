#!/bin/bash

# Generate SSL certificates if they don't exist
if [ ! -f ./nginx/ssl/server.crt ]; then
  echo "Generating SSL certificates..."
  ./generate-ssl-certs.sh
fi

# Create necessary directories
mkdir -p ./logs
mkdir -p ./nginx/logs

# Build and start the containers
docker-compose up -d --build

# Display container status
docker-compose ps

echo "Application started successfully!"
echo "API is available at https://localhost/api"
echo "Swagger documentation is available at https://localhost/api/docs"