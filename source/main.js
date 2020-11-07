let package = require("../package.json")
let ezRpc = require("../ez-rpc/javascript/backend")
let { connectToMongoDb, mongoInterface } = require("./ezMongoDb/mongoSystem")

connectToMongoDb(package.parameters.databaseSetup);
(new ezRpc({
    port: 4321,
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
})).start()