// require("./source/debug")

let package = require("../package.json")
let ezRpc = require("ez-rpc-backend")
let mongoSystem = require("./ezMongoDb/mongoSystem")
// make lodash global because I like to live dangerously
for (const [eachKey, eachValue] of Object.entries(require("lodash"))) { global[eachKey] = eachValue }
mongoSystem.connectToMongoDb(package.parameters.databaseSetup)

global.package = package

global.mongoSystem = mongoSystem

global.interface = require('require-all')({
    dirname:  __dirname + '/interface',
    filter:  /.+\.js$/,
    // remove the .js part of the name
    map: (name, path)=>name.replace(/\.js$/, ""),
    recursive: true,
})

// a helper for getting async values inside of a command line instance
// usage
//     a = promise.wait
//     a.result 
Object.defineProperty(Object.prototype, "wait", {
    get() {
        let dataWrapper = {}
        this.then(result=>dataWrapper.result=result)
        return dataWrapper
    }
})