#!/usr/bin/env bash 
echo "============================"
echo "Enter the name of the backup"
echo "============================"
ls -1 ./backups.nosync

read backup_name
mongorestore --dir "./backups.nosync/$backup_name"