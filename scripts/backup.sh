#!/bin/sh

# SQLite Backup Script for Docker
# Runs periodically to backup database files

set -e

BACKUP_DIR="/backup"
SOURCE_DIR="/source"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
INTERVAL=${BACKUP_INTERVAL:-86400}

echo "🔄 SQLite Backup Service Started"
echo "   Backup Directory: $BACKUP_DIR"
echo "   Source Directory: $SOURCE_DIR"
echo "   Retention: $RETENTION_DAYS days"
echo "   Interval: $INTERVAL seconds"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

backup_database() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/evolution_backup_$TIMESTAMP.db"
    
    echo "📦 Creating backup: $BACKUP_FILE"
    
    # Find and copy database files
    if [ -f "$SOURCE_DIR/evolution.db" ]; then
        cp "$SOURCE_DIR/evolution.db" "$BACKUP_FILE"
        echo "✅ Backup created successfully"
        
        # Compress backup
        if command -v gzip > /dev/null; then
            gzip "$BACKUP_FILE"
            echo "🗜️  Backup compressed: ${BACKUP_FILE}.gz"
        fi
    else
        echo "⚠️  No database file found at $SOURCE_DIR/evolution.db"
    fi
    
    # Cleanup old backups
    echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "evolution_backup_*.db*" -type f -mtime +$RETENTION_DAYS -delete
    echo "✅ Cleanup complete"
}

# Initial backup
backup_database

# Periodic backups
while true; do
    sleep $INTERVAL
    backup_database
done
