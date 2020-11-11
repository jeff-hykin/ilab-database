let package = require("../package.json")
let ezRpc = require("ez-rpc-backend")
let { connectToMongoDb, mongoInterface } = require("./ezMongoDb/mongoSystem")

connectToMongoDb(package.parameters.databaseSetup)
new ezRpc({
    port: 54321,
    startImmediately: true,
    interface: {
        mongoInterface,
        ...require('require-all')({
            dirname:  __dirname + '/interface',
            filter:  /.+\.js$/,
            // remove the .js part of the name
            map: (name, path)=>name.replace(/\.js$/, ""),
            recursive: true,
        })
    },
})