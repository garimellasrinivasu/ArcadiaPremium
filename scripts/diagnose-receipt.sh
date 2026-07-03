#!/bin/bash
# =====================================================
# Receipt Image Diagnostic Script
# Run this on the server: bash ~/arcadia-app/scripts/diagnose-receipt.sh
# =====================================================

echo "============================================="
echo "  RECEIPT IMAGE DIAGNOSTIC"
echo "  $(date)"
echo "============================================="

echo ""
echo "--- STEP 1: Check if receipt data exists in the database ---"
docker exec arcadia-db psql -U dev_user -d arcadia -c "
SELECT
  id,
  status,
  LENGTH(receipt_image_base64) as img_bytes,
  CASE
    WHEN receipt_image_base64 IS NULL THEN 'NULL'
    WHEN receipt_image_base64 = '' THEN 'EMPTY'
    WHEN LEFT(receipt_image_base64, 5) = 'data:' THEN 'DATA_URL: ' || LEFT(receipt_image_base64, 30) || '...'
    ELSE 'RAW: ' || LEFT(receipt_image_base64, 30) || '...'
  END as img_format
FROM finance_spent
WHERE status = 'PAID'
ORDER BY id DESC
LIMIT 10;
"
echo ""

echo "--- STEP 2: Check total entries and receipt stats ---"
docker exec arcadia-db psql -U dev_user -d arcadia -c "
SELECT
  COUNT(*) as total_entries,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_entries,
  COUNT(CASE WHEN receipt_image_base64 IS NOT NULL AND receipt_image_base64 != '' THEN 1 END) as with_receipt,
  COUNT(CASE WHEN receipt_image_base64 IS NULL OR receipt_image_base64 = '' THEN 1 END) as without_receipt
FROM finance_spent;
"
echo ""

echo "--- STEP 3: Get auth token ---"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arcadia.com","password":"Admin@123"}' 2>&1)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FAILED to get auth token!"
  echo "Login response: $LOGIN_RESPONSE"
  echo ""
  echo "Trying alternate credentials..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"garimella.srinivasu@gmail.com","password":"Admin@123"}' 2>&1)
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "FAILED to authenticate. Skipping API tests."
  echo "Response: $LOGIN_RESPONSE"
else
  echo "Auth token obtained successfully."
  echo ""

  # Find a PAID entry with receipt
  PAID_ID=$(docker exec arcadia-db psql -U dev_user -d arcadia -t -c "
    SELECT id FROM finance_spent
    WHERE status = 'PAID' AND receipt_image_base64 IS NOT NULL AND receipt_image_base64 != ''
    ORDER BY id DESC LIMIT 1;
  " | tr -d ' ')

  if [ -z "$PAID_ID" ]; then
    echo "WARNING: No PAID entries with receipt images found in database!"
    echo "The receipt was likely never saved. Checking all entries..."
    PAID_ID=$(docker exec arcadia-db psql -U dev_user -d arcadia -t -c "
      SELECT id FROM finance_spent ORDER BY id DESC LIMIT 1;
    " | tr -d ' ')
  fi

  echo "--- STEP 4: Test /receipt JSON endpoint (entry ID: $PAID_ID) ---"
  RECEIPT_RESPONSE=$(curl -s -w "\n---HTTP_CODE:%{http_code}---SIZE:%{size_download}---" \
    http://localhost:3001/api/finance-spent/${PAID_ID}/receipt \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  HTTP_CODE=$(echo "$RECEIPT_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
  RESP_SIZE=$(echo "$RECEIPT_RESPONSE" | grep -o 'SIZE:[0-9]*' | cut -d: -f2)

  echo "HTTP Status: $HTTP_CODE"
  echo "Response Size: $RESP_SIZE bytes"
  if [ "$HTTP_CODE" = "200" ]; then
    echo "Response preview: $(echo "$RECEIPT_RESPONSE" | head -c 200)"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo ">>> PROBLEM: /receipt endpoint does NOT exist in deployed backend!"
    echo ">>> The backend code changes were NOT deployed."
  elif [ "$HTTP_CODE" = "500" ]; then
    echo ">>> PROBLEM: Server error when fetching receipt."
    echo ">>> Response: $(echo "$RECEIPT_RESPONSE" | head -c 500)"
  else
    echo "Response: $(echo "$RECEIPT_RESPONSE" | head -c 500)"
  fi
  echo ""

  echo "--- STEP 5: Test /receipt-image binary endpoint (entry ID: $PAID_ID) ---"
  BINARY_RESPONSE=$(curl -s -w "\n---HTTP_CODE:%{http_code}---SIZE:%{size_download}---CONTENT_TYPE:%{content_type}---" \
    http://localhost:3001/api/finance-spent/${PAID_ID}/receipt-image \
    -H "Authorization: Bearer $TOKEN" -o /dev/null 2>&1)
  HTTP_CODE2=$(echo "$BINARY_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
  RESP_SIZE2=$(echo "$BINARY_RESPONSE" | grep -o 'SIZE:[0-9]*' | cut -d: -f2)
  CONTENT_TYPE=$(echo "$BINARY_RESPONSE" | grep -o 'CONTENT_TYPE:[^-]*' | cut -d: -f2-)

  echo "HTTP Status: $HTTP_CODE2"
  echo "Response Size: $RESP_SIZE2 bytes"
  echo "Content-Type: $CONTENT_TYPE"
  if [ "$HTTP_CODE2" = "404" ]; then
    echo ">>> NOTE: /receipt-image endpoint not deployed yet (expected if using older code)"
  fi
  echo ""
fi

echo "--- STEP 6: Check if frontend has updated receipt code ---"
echo "Checking for getReceiptBlob in frontend JS..."
BLOB_COUNT=$(docker exec frontend grep -rl "receipt-image\|getReceiptBlob" /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | wc -l)
echo "Files with getReceiptBlob/receipt-image: $BLOB_COUNT"

echo "Checking for getReceipt in frontend JS..."
RECEIPT_COUNT=$(docker exec frontend grep -c "receipt" /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | grep -v ":0$" | head -5)
echo "Files with 'receipt': $RECEIPT_COUNT"
echo ""

echo "--- STEP 7: Check backend logs for receipt-related errors ---"
echo "Last 50 lines of backend logs with receipt/error/exception:"
docker logs backend --tail 100 2>&1 | grep -i "receipt\|error\|exception\|OOM\|OutOfMemory" | tail -20
echo ""

echo "--- STEP 8: Container status and memory ---"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null
echo ""

echo "--- STEP 9: Check which Docker images are running ---"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.CreatedAt}}" 2>/dev/null
echo ""

echo "============================================="
echo "  DIAGNOSIS COMPLETE"
echo "============================================="
echo ""
echo "Common issues:"
echo "  - If Step 1 shows 'NULL' or 'EMPTY': Receipt was never saved to DB"
echo "  - If Step 4 shows 404: Backend code not deployed (rebuild & redeploy)"
echo "  - If Step 4 shows 500: Server error (check Step 7 for details)"
echo "  - If Step 6 shows 0: Frontend code not deployed (rebuild & redeploy)"
echo "  - If Step 7 shows OOM: Server running out of memory"
echo ""
