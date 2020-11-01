#!/usr/bin/env bash 
echo "Enter a a name for the backup"
read backup_name
mongodump -o "./backups.nosync/$backup_name"