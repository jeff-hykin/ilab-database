#!/usr/bin/env node
let mongoSetup = require("../../source/mongo_setup")
let endpointTools = require("../../source/endpoint_tools.js")

;;(async _=>{
    await require("./debug_setup")
    global.observationIterator = mongoInterface.all({
        from: 'observations',
        where: [
            {
                valueOf: ["type"],
                is: "segment",
            }
        ]
    }, {interativeRetrival: true})
    // moment1
    // 06p9kQ9AsXM
    // happy
    // 179000
    // 181000

    // moment2
    // 06p9kQ9AsXM
    // happy
    // 272006
    // 279996
    
    // moment3
    // FLK5-00l0r4
    // happy
    // 126000
    // 127000
})()