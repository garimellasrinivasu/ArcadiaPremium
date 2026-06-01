#!/bin/bash
# Arcadia Premium - Safe Restart Script
# Restarts services in the correct order: DB -> Backend -> Frontend
# Usage: ./restart.sh           (restart all)
#        ./restart.sh backend   (restart backend only)

set -e
cd ~/arcadia-app

echo "=== Arcadia Premium Restart ==="

if [ "$1" = "backend" ]; then
  echo "[1/2] Restarting backend..."
  docker restart backend
  echo "[2/2] Waiting for backend to start..."
  for i in {1..30}; do
    if docker exec backend wget -qO- http://localhost:8080/api/auth/login 2>&1 | grep -q "405\|200"; then
      echo "       Backend is ready!"
      break
    fi
    [ $i -eq 30 ] && echo "       WARNING: Backend may not be ready yet"
    sleep 2
  done
  echo "=== Done ==="
  exit 0
fi

echo "[1/5] Restarting database..."
docker restart arcadia-db

echo "[2/5] Waiting for PostgreSQL to be ready..."
for i in {1..20}; do
  if docker exec arcadia-db pg_isready -U dev_user -d arcadia > /dev/null 2>&1; then
    echo "       Database is ready!"
    break
  fi
  [ $i -eq 20 ] && echo "       WARNING: Database may not be ready yet"
  echo "       Waiting... ($i/20)"
  sleep 2
done

echo "[3/5] Restarting backend..."
docker restart backend

echo "[4/5] Waiting for backend to start (~30s)..."
for i in {1..30}; do
  if docker exec backend wget -qO- http://localhost:8080/api/auth/login 2>&1 | grep -q "405\|200"; then
    echo "       Backend is ready!"
    break
  fi
  [ $i -eq 30 ] && echo "       WARNING: Backend may not be ready yet"
  sleep 2
done

echo "[5/5] Restarting frontend..."
docker restart frontend
sleep 3

echo ""
echo "=== All services restarted ==="
echo "Testing login endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "Login endpoint responding ($HTTP_CODE) - Everything is working!"
else
  echo "WARNING: Login endpoint returned $HTTP_CODE"
  echo "Check logs: docker logs backend --tail 50"
fi
