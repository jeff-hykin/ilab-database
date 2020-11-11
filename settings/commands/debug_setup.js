global.mongoSetup = require("../../source/mongo_setup")
global.endpointTools = require("../../source/endpoint_tools.js")

// a helper for getting async values inside of a command line instance
Object.defineProperty(Object.prototype, "wait", {
    get() {
        let dataWrapper = {}
        this.then(result=>dataWrapper.result=result)
        return dataWrapper
    }
})

global.endpoints = require('require-all')({
    dirname:  __dirname + '/../../source/endpoints',
    filter:  /.+\.js$/,
    // remove the .js part of the name
    map: (name, path)=>name.replace(/\.js$/, ""),
    recursive: true,
})

module.exports = (async _=>{
    let result = await mongoSetup.connectToMongoDb()
    global.db = result.db
    global.mongoInterface = endpointTools.mongoInterface
    console.log(`finished setup`)
})()