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

# Check if pg_dump is available natively
if ! command -v pg_dump &> /dev/null; then
    echo "[$(date)] ERROR: 'pg_dump' could not be found."
    echo "Please install it by running: sudo apt update && sudo apt install -y postgresql-client"
    exit 1
fi

# Perform the backup
pg_dump -U "$DB_USER" -h localhost -p 5432 "$DB_NAME" > "$BACKUP_FILE"

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
