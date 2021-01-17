# spin up mongo in the background
sh ./settings/commands/db_start.sh &

# install/update all the needed libs for the express server
npm install

# keep the express server running and tell it to watch for updates
mkdir -p "./settings/processes.nosync"
npx nodemon ./source/main.js &
echo "$!" > "./settings/processes.nosync/express.pid"