const fs = require("fs")
const mongoDb = require('mongodb')
const PARAMETERS = require("../package.json").parameters.database

let db
let mainCollection
let mongoUrl = `mongodb://${PARAMETERS.MONGO_ADDRESS}:${PARAMETERS.MONGO_PORT}/${PARAMETERS.MONGO_USERNAME}/${PARAMETERS.DEFAULT_DATABASE}`
async function connectToMongoDb() {
    try {
        let client = await mongoDb.MongoClient.connect(mongoUrl, {useUnifiedTopology: true})
        // init variables
        db = client.db(PARAMETERS.DEFAULT_DATABASE)
        global.db = db
        mainCollection = db.collection(PARAMETERS.DEFAULT_COLLECTION)
        global.mainCollection = mainCollection // used in the conversion from database structure v1 to structure v2
        return { db, mainCollection, client }
    } catch (error) {
        // if its a conntection issue retry
        if (error instanceof mongoDb.MongoNetworkError) {
            console.log(`Unable to connect to mongodb (give it a few seconds), retrying in a few seconds`)
            let sleepTime = 6 // seconds
            setTimeout(() => {
                // check if it is generateing a database
                if (!fs.existsSync("/data/db/mongod.lock")) {
                    console.log(`\n\nIt appears the mongodb database hasn't been setup yet\nthis is probably NOT a problem, I'm going to wait ${sleepTime} seconds and then check on the process again\n\nIf you see this message after several minutes of waiting, something is probably wrong\nit is likely that the volume that was supposed to be mounted\n    --volume FOLDER_WITH_YOUR_DATABASE:/data\nwas somehow not setup correctly (or maybe you never added that volume at all)\nBTW this check uses the /data/db/mongod.lock to confirm if the database exists`)
                }
                // try again
                connectToMongoDb()
            }, sleepTime * 1000)
        }
    }
}

module.exports = {
    db,
    mainCollection,
    connectToMongoDb,
}