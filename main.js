let { connectToMongoDb } = require("./source/mongo_setup")
let { setupEndpoints } = require("./source/endpoints")
let { startServer } = require("./source/server")
Object.fromEntries || (Object.fromEntries = require('object.fromentries')) // polyfill for an old node version


async function asyncMain() {
    // first connect to the database
    const data = await connectToMongoDb()
    // then setup the endpoints that expose the database
    setupEndpoints(data)
    // then start the server
    await startServer()
}
asyncMain()