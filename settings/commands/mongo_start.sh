# remove tmp's leftover from a bad shutdown
rm -f /tmp/mongodb-27017.sock
# if it fails try repairing it
mongod --bind_ip 127.0.0.1 || mongod --repair --bind_ip 127.0.0.1