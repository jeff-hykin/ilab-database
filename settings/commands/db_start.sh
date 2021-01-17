# remove tmp's leftover from a bad shutdown
rm -f /tmp/mongodb-27017.sock

DATABASE_PATH="$(node -e 'console.log(require("./package.json").parameters.databaseSetup.databasePath)')"
mkdir -p "$DATABASE_PATH"

mkdir -p "./settings/processes.nosync"
mkdir -p "./settings/logs.nosync"
{
    # if it fails try repairing it (the or statement)
    mongod --bind_ip 127.0.0.1 --dbpath "$DATABASE_PATH" || mongod --repair --bind_ip 127.0.0.1
} &> "./settings/logs.nosync/server.log" &
echo "$!" > "./settings/processes.nosync/database.pid"