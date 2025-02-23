#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api/v1"
TOKEN="" # Will be set after login

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# First verify API routes are set up
echo "Verifying API Routes Setup..."
curl -s http://localhost:3000/api/v1/ 2>&1 | grep -q "Cannot GET" && {
    echo -e "${GREEN}✓ Server is running${NC}"
} || {
    echo -e "${RED}✗ Server is not running${NC}"
    exit 1
}

# Helper function for testing endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local auth=${5:-true}

    echo -e "\nTesting ${method} ${endpoint}"
    
    local auth_header=""
    if [ "$auth" = true ] && [ ! -z "$TOKEN" ]; then
        auth_header="-H \"Authorization: Bearer ${TOKEN}\""
    fi

    local curl_cmd="curl -s -X ${method} \"${BASE_URL}${endpoint}\" ${auth_header}"
    if [ ! -z "$data" ]; then
        curl_cmd="${curl_cmd} -H \"Content-Type: application/json\" -d '${data}'"
    fi
    
    local response=$(eval ${curl_cmd})
    local status=$(echo $response | jq -r '.success')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Test passed${NC}"
    else
        echo -e "${RED}✗ Test failed${NC}"
        echo "Response: $response"
    fi
}

# Test Authentication
echo "Testing Authentication APIs..."
test_endpoint "POST" "/auth/register" true '{"email":"test@example.com","password":"Test123!","role":"seller"}' false
test_endpoint "POST" "/auth/login" true '{"email":"test@example.com","password":"Test123!"}' false

# Set token from login response for subsequent requests
TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!"}' | jq -r '.token')

# Test Product Management
echo -e "\nTesting Product Management APIs..."
test_endpoint "POST" "/products/create" true '{"title":"Test Product","description":"Test Description","price":99.99,"category_id":"1"}'
test_endpoint "GET" "/products/list" true "" false
test_endpoint "GET" "/products/1" true "" false
test_endpoint "PUT" "/products/1/update" true '{"title":"Updated Product"}'
test_endpoint "POST" "/products/1/disable" true ""

# Test Order Management
echo -e "\nTesting Order Management APIs..."
test_endpoint "POST" "/orders/create" true '{"product_id":"1"}'
test_endpoint "GET" "/orders/list" true ""
test_endpoint "GET" "/orders/1" true ""
test_endpoint "PUT" "/orders/1/update-status" true '{"status":"completed"}'

# Test Search & Filtering
echo -e "\nTesting Search APIs..."
test_endpoint "GET" "/search?query=test" true "" false
test_endpoint "GET" "/search/category/1" true "" false
test_endpoint "GET" "/search/price-range?min_price=10&max_price=100" true "" false

# Test Reviews
echo -e "\nTesting Review APIs..."
test_endpoint "POST" "/reviews/sellers/1/create" true '{"rating":5,"comment":"Great seller!"}'
test_endpoint "GET" "/reviews/sellers/1" true "" false
test_endpoint "DELETE" "/reviews/1/delete" true ""

# Test Admin Controls
echo -e "\nTesting Admin APIs..."
test_endpoint "POST" "/admin/sellers/1/disable" true ""
test_endpoint "POST" "/admin/products/1/disable" true ""
test_endpoint "PUT" "/admin/orders/1/update-status" true '{"status":"cancelled"}'

echo -e "\nAPI Testing Complete!"
