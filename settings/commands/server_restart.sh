function find_and_kill {
    application=$1
    results=$(ps aux | grep "$application" | awk '{print $2}' )
    echo $results
    kill $results &>/dev/null
}

# kill previous
find_and_kill "npx nodemon main.js"
find_and_kill "node main.js"
find_and_kill "mongod --bind_ip 127.0.0.1"
find_and_kill "mongod --repair --bind_ip 127.0.0.1"

# start server
./settings/commands/server_start.sh