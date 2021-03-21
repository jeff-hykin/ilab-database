const { connectToMongoDb } = require("../ezMongoDb/mongoSystem")
let package = require("../../package.json")

module.exports = async ([databaseName]) => {
    await connectToMongoDb({...package.parameters.databaseSetup, databaseName })
}