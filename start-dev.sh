#!/bin/bash
# ============================================================
# Arcadia Premium — Development Mode (Two Servers)
# Starts backend on :8080 and frontend on :3000
# Both bound to 0.0.0.0 for LAN access
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

echo ""
echo "========================================="
echo "  Arcadia Premium — Dev Mode"
echo "========================================="
echo ""
echo "  Your Mac's IP: $LOCAL_IP"
echo ""
echo "  Office members access at:"
echo "    http://$LOCAL_IP:3000"
echo ""
echo "  On this Mac:"
echo "    http://localhost:3000"
echo ""
echo "========================================="
echo ""

# Start backend in background
echo "[1/2] Starting backend on port 8080..."
cd "$BACKEND_DIR"
if command -v mvn &> /dev/null; then
  mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m" &
else
  echo "ERROR: Maven not found! Install: brew install maven"
  exit 1
fi
BACKEND_PID=$!

# Wait for backend to start
echo "       Waiting for backend to be ready..."
sleep 10

# Start frontend
echo "[2/2] Starting frontend on port 3000..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers running. Press Ctrl+C to stop both."
echo ""

# Trap Ctrl+C to kill both
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
