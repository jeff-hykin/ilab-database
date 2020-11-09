# spin up mongo in the background
sh ./settings/commands/db_start.sh &>./log.nosync.txt  &
# install all the needed libs for the express server
npm install
# keep the express server running and tell it to watch for updates
npx nodemon main.js &>./log.nosync.txt  &

