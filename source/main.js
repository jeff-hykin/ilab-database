let package = require("../package.json")
let ezRpc = require("ez-rpc-backend")
let { connectToMongoDb, mongoInterfaceUnwrapper } = require("./ezMongoDb/mongoSystem")
// make lodash global because I like to live dangerously
for (const [eachKey, eachValue] of Object.entries(require("lodash"))) { global[eachKey] = eachValue }

connectToMongoDb(package.parameters.databaseSetup)
new ezRpc({
    port: package.parameters.port,
    startImmediately: true,
    interface: {
        mongoInterface: mongoInterfaceUnwrapper,
        ...require('require-all')({
            dirname:  __dirname + '/interface',
            filter:  /.+\.js$/,
            // remove the .js part of the name
            map: (name, path)=>name.replace(/\.js$/, ""),
            recursive: true,
        })
    },
})