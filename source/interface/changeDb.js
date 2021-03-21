const { connectToMongoDb } = require("../ezMongoDb/mongoSystem")
let package = require("../../package.json")

module.exports = async ([databaseName]) => {
    let result
    try {
        result = await connectToMongoDb({...package.parameters.databaseSetup, databaseName })
    } catch (error) {
        throw error
    }
    // just redo the connect
    return result
}