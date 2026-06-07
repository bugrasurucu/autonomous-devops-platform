#!/bin/bash
set -e

LOGIN_RES=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test3@example.com","password":"password123"}')
TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  echo $LOGIN_RES
  exit 1
fi
echo "Token obtained."

echo "3. Creating deployment..."
DEP_RES=$(curl -s -X POST http://localhost:3001/api/deploy -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"projectName":"test-project", "environment":"staging", "region":"eu-central-1", "budget":50}')
DEP_ID=$(echo $DEP_RES | grep -o '"deployId":"[^"]*' | cut -d'"' -f4)

if [ -z "$DEP_ID" ]; then
  echo "Failed to get deployId"
  echo $DEP_RES
  exit 1
fi
echo "Deployment ID: $DEP_ID"

echo "4. Testing /container-stats..."
curl -s -X GET "http://localhost:3001/api/deployments/$DEP_ID/container-stats" -H "Authorization: Bearer $TOKEN" | jq .

echo "5. Testing /chat..."
curl -s -X POST "http://localhost:3001/api/deployments/$DEP_ID/chat" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"message":"Hello!"}' | jq .

