# spin up mongo in the background
eacho "$(sh ./settings/commands/db_start.sh &)"
# install all the needed libs for the express server
npm install
# keep the express server running and tell it to watch for updates
echo "$(npx nodemon ./source/main.js &)"
# allow the user to control the system
bash