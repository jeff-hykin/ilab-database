const { connectToMongoDb } = require("../ezMongoDb/mongoSystem")
let package = require("../../package.json")

module.exports = async ([databaseName]) => {
    // just redo the connect
    return connectToMongoDb({...package.parameters.databaseSetup, databaseName })
}