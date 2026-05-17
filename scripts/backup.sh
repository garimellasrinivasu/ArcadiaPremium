#!/bin/bash

# Configuration
BACKUP_DIR="$HOME/arcadia-backups"
CONTAINER_NAME="arcadia-db"
DB_USER="dev_user"
DB_NAME="arcadia"
RETENTION_DAYS=7

# Email Alert Configuration (Optional)
# Fill these in to receive an email if the backup fails
export ALERT_EMAIL="dinakar.anumolu@zohomail.com"
export SMTP_USER="dinakar.anumolu@zohomail.com"
export SMTP_HOST="smtp.zoho.com"
export SMTP_PORT="587"

# Load secure SMTP password from hidden server file
if [ -f "$HOME/.backup_secrets" ]; then
    source "$HOME/.backup_secrets"
fi

# Remote Sync Configuration
export REMOTE_SYNC_ENABLED="true"
export REMOTE_SERVER="192.168.1.9"
export REMOTE_USER="ubuntu"  # Update with the correct username on 192.168.1.9
export REMOTE_DIR="~/arcadia-backups-sync"

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
    
    # Sync to remote server if enabled
    if [ "$REMOTE_SYNC_ENABLED" = "true" ] && [ -n "$REMOTE_SERVER" ] && [ -n "$REMOTE_USER" ]; then
        echo "Syncing backup to remote server $REMOTE_SERVER..."
        
        # Ensure remote directory exists
        ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_SERVER" "mkdir -p $REMOTE_DIR" 2>/dev/null
        
        # Copy the backup file
        scp -o StrictHostKeyChecking=no "$BACKUP_FILE" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_DIR/"
        
        if [ $? -eq 0 ]; then
            echo "Successfully synced backup to $REMOTE_SERVER."
        else
            echo "Warning: Failed to sync backup to $REMOTE_SERVER. Check your SSH keys and permissions."
        fi
    fi
    
    # Clean up old backups
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "Cleanup complete."
else
    echo "Error: Database backup failed!"
    # Delete the potentially corrupted/empty backup file
    rm -f "$BACKUP_FILE"
    
    # Send email alert if configured
    if [ -n "$ALERT_EMAIL" ] && [ -n "$SMTP_USER" ] && [ -n "$SMTP_PASS" ]; then
        echo "Sending failure email alert to $ALERT_EMAIL..."
        python3 -c "
import smtplib, os
from email.message import EmailMessage
msg = EmailMessage()
msg.set_content('CRITICAL: The ArcadiaPremium database backup script encountered an error and failed to create a backup on ' + os.uname()[1] + '.\n\nPlease check the server logs immediately.')
msg['Subject'] = 'CRITICAL: Database Backup Failed'
msg['From'] = os.environ.get('SMTP_USER')
msg['To'] = os.environ.get('ALERT_EMAIL')
try:
    server = smtplib.SMTP(os.environ.get('SMTP_HOST'), int(os.environ.get('SMTP_PORT')))
    server.starttls()
    server.login(os.environ.get('SMTP_USER'), os.environ.get('SMTP_PASS'))
    server.send_message(msg)
    server.quit()
    print('Alert email sent successfully.')
except Exception as e:
    print('Failed to send email alert:', str(e))
"
    else
        echo "Email alerts are not configured. Skipping email notification."
    fi
    
    exit 1
fi
