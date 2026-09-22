#!/bin/bash
# =========================================================
# Update WhatsApp Access Token and restart backend
# Usage: ./scripts/update-whatsapp-token.sh YOUR_NEW_TOKEN
# =========================================================

set -e

# Navigate to project directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ -z "$1" ]; then
  echo "Usage: $0 <NEW_WHATSAPP_ACCESS_TOKEN>"
  echo ""
  echo "Get your token from:"
  echo "  https://developers.facebook.com → Your App → WhatsApp → API Setup"
  exit 1
fi

NEW_TOKEN="$1"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Update token in .env file
sed -i "s|^WHATSAPP_ACCESS_TOKEN=.*|WHATSAPP_ACCESS_TOKEN=$NEW_TOKEN|" "$ENV_FILE"

echo "Token updated in .env"
echo "Restarting backend container..."

docker compose restart backend

echo ""
echo "Done! Backend restarted with new WhatsApp token."
echo "Check logs: docker compose logs -f backend --tail=20"
