function find_process {
    application=$1
    results=$(ps aux | grep "$application" | awk '{print $2}' )
    echo $results
}

# kill previous
find_process "npx nodemon main.js"
find_process "node main.js"
find_process "mongod --bind_ip 127.0.0.1"
find_process "mongod --repair --bind_ip 127.0.0.1"