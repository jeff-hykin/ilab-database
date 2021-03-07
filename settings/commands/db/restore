#!/usr/bin/env bash 
echo "============================"
echo "Enter the name of the backup"
echo "============================"
ls -1 ./backups.nosync

echo "Don't forget to restore the compressionMapping.json"
read backup_name
mongorestore --dir "./backups.nosync/$backup_name"