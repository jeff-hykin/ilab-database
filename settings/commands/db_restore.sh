#!/usr/bin/env bash 
echo "Enter the name of the backup"
read backup_name
mongorestore --dir "./backups.nosync/$backup_name"