#!/usr/bin/env bash 

function find_process {
    application=$1
    echo "$(ps aux | grep "$application" | grep -v " grep ")"
}

# kill previous
find_process "npx nodemon main.js"
find_process "node main.js"
find_process "mongod --bind_ip 127.0.0.1"
find_process "mongod --repair --bind_ip 127.0.0.1"