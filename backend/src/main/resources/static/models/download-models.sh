#!/bin/bash
# Run this script from the frontend/public/models/ directory to download
# face-api.js model weights for local/offline use.
#
# Usage:
#   cd frontend/public/models
#   bash download-models.sh

BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

echo "Downloading SSD MobileNet v1 (face detection)..."
curl -LO "$BASE/ssd_mobilenetv1_model-weights_manifest.json"
curl -LO "$BASE/ssd_mobilenetv1_model-shard1"
curl -LO "$BASE/ssd_mobilenetv1_model-shard2"

echo "Downloading Age & Gender model..."
curl -LO "$BASE/age_gender_model-weights_manifest.json"
curl -LO "$BASE/age_gender_model-shard1"

echo "Done! Models saved to $(pwd)"
ls -lh
