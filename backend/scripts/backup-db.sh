#!/bin/bash

# ==========================================
# ArcadiaPremium Automated Database Backup
# ==========================================

DB_NAME="arcadia_premium"
DB_USER="arcadia"
# Using the hardcoded local password. For production, a .pgpass file is safer.
export PGPASSWORD="arcadia123" 

# Directory to store backups (defaults to a folder in the user's home directory)
BACKUP_DIR="/home/$USER/db_backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${DATE}.sql"

# How many days of backups to keep (prevents disk filling up)
DAYS_TO_KEEP=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of database '$DB_NAME' to $BACKUP_FILE..."

# Find the running postgres docker container
CONTAINER_ID=$(docker ps -q -f "ancestor=postgres" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "[$(date)] ERROR: Could not find a running Postgres Docker container!"
    exit 1
fi

echo "[$(date)] Found Postgres container: $CONTAINER_ID"

# Perform the backup using the pg_dump inside the docker container
# This guarantees the pg_dump version exactly matches the database version
docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER_ID" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully."
    
    # Compress the backup to save disk space
    gzip "$BACKUP_FILE"
    echo "[$(date)] Backup compressed to ${BACKUP_FILE}.gz"

    # Delete backups older than our retention policy
    echo "[$(date)] Cleaning up backups older than $DAYS_TO_KEEP days..."
    find "$BACKUP_DIR" -type f -name "${DB_NAME}_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
    echo "[$(date)] Cleanup complete."
else
    echo "[$(date)] ERROR: Backup failed!"
    # Remove the empty/corrupted file if it failed
    rm -f "$BACKUP_FILE"
    exit 1
fi
