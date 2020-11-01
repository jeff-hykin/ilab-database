# spin up mongo in the background
sh ./actions/start_mongo.sh &
# install all the needed libs for the express server
npm install
# keep the express server running and tell it to watch for updates
nodemon main.js &
# allow the user to control the system
bash