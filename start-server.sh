#!/bin/bash
# ============================================================
# Arcadia Premium — Single-Server Startup Script
# Builds frontend, copies into Spring Boot static folder,
# and starts the backend on port 8080 accessible to all
# devices on the network.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"
STATIC_DIR="$BACKEND_DIR/src/main/resources/static"

echo ""
echo "========================================="
echo "  Arcadia Premium — Server Startup"
echo "========================================="
echo ""

# Step 1: Build frontend
echo "[1/4] Building frontend..."
cd "$FRONTEND_DIR"
npm install --silent 2>/dev/null
npm run build
echo "       Frontend built successfully."

# Step 2: Copy build output to Spring Boot static folder
echo "[2/4] Copying frontend to backend static folder..."
rm -rf "$STATIC_DIR"
mkdir -p "$STATIC_DIR"
cp -r "$FRONTEND_DIR/dist/"* "$STATIC_DIR/"
echo "       Frontend copied to $STATIC_DIR"

# Step 3: Get Mac's local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")
echo ""
echo "[3/4] Detected your Mac's local IP: $LOCAL_IP"

# Step 4: Start Spring Boot
echo "[4/4] Starting Spring Boot server on port 8080..."
echo ""
echo "========================================="
echo "  Server starting..."
echo ""
echo "  Office members can access at:"
echo "    http://$LOCAL_IP:8080"
echo ""
echo "  On this Mac:"
echo "    http://localhost:8080"
echo ""
echo "  Login: admin@arcadiapremium.com"
echo "  Password: admin123"
echo "========================================="
echo ""

cd "$BACKEND_DIR"

# Enable SPA forwarding for single-server mode
export SPA_FORWARD=true

# Use mvnw if available, otherwise fall back to mvn
if [ -f "./mvnw" ]; then
  ./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
elif command -v mvn &> /dev/null; then
  mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
else
  echo ""
  echo "ERROR: Maven not found! Install it with:"
  echo "  brew install maven"
  echo ""
  exit 1
fi
