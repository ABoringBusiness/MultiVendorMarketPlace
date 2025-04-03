#!/bin/bash

# Create directory for SSL certificates if it doesn't exist
mkdir -p ./nginx/ssl

# Generate self-signed SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/server.key \
  -out ./nginx/ssl/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

# Set proper permissions
chmod 600 ./nginx/ssl/server.key
chmod 644 ./nginx/ssl/server.crt

echo "Self-signed SSL certificates generated successfully!"