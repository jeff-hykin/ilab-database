function find_and_kill {
    application=$1
    ps aux | grep "$application" | awk '{print $2}' | xargs kill -9 $1
}

# kill previous
find_and_kill "npx nodemon main.js"
find_and_kill "sh ./settings/commands/db_start.sh"

# start server
./settings/commands/server_start.sh