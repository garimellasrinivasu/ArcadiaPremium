#!/bin/bash

# Configuration
BACKUP_DIR="$HOME/arcadia-backups"
CONTAINER_NAME="arcadia-db"
DB_USER="dev_user"
DB_NAME="arcadia"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "Starting database backup for $DB_NAME..."

# Execute pg_dump inside the container and compress the output
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Clean up old backups
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "Cleanup complete."
else
    echo "Error: Database backup failed!"
    # Delete the potentially corrupted/empty backup file
    rm -f "$BACKUP_FILE"
    exit 1
fi
