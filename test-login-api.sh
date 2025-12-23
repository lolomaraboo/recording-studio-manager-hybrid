#!/bin/bash
# Test Client Portal Login API

echo "Testing login API..."

curl -s -X POST 'http://localhost:3001/api/trpc/clientPortalAuth.login?batch=1' \
  -H 'Content-Type: application/json' \
  -d '{"0":{"json":{"email":"test@example.com","password":"password123"}}}' \
  | jq .
