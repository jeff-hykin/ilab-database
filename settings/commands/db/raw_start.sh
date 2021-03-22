#!/usr/bin/env bash 

# make the path for the database
DATABASE_PATH="$(node -e 'console.log(require("./package.json").parameters.databaseSetup.databasePath)')"
mkdir -p "$DATABASE_PATH"

# if start fails
mongod --bind_ip 127.0.0.1 --dbpath "$DATABASE_PATH" || {
    # try repairing
    rm -f /tmp/mongodb-27017.sock # remove tmp's leftover from a bad shutdown
    mongod --repair --bind_ip 127.0.0.1 --dbpath "$DATABASE_PATH" && {
        # if successful then restart
        mongod --bind_ip 127.0.0.1 --dbpath "$DATABASE_PATH"
    }
}