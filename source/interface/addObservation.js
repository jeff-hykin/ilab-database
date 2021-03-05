const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const validateObservation = require("./validateObservation")
const extractYoutubeId = require("../toolbox/extractYoutubeId")
const crypto = require('crypto')
const stringify = require('fast-json-stable-stringify')

let hashFunc = (data)=>crypto.createHash('sha1').update(stringify(data)).digest('base64')

module.exports = async ([observationEntry]) => {
    // perform id extraction before check
    if (observationEntry instanceof Object) {
        observationEntry.videoId = extractYoutubeId(observationEntry.videoId)
    }
    // 
    // Check data
    // 
    let result = await validateObservation([observationEntry])
    if (result !== true) {
        throw Error(result)
    }
    let idForNewMoment = hashFunc({...observationEntry, uploadTime: null})

    // set the new moment
    await mongoInterface.set({
        keyList: [ idForNewMoment ],
        from: "observations",
        to: {
            ...observationEntry,
        },
    })
    
    return idForNewMoment
}