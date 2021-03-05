const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const validateObservation = require("./validateObservation")
const extractYoutubeId = require("../toolbox/extractYoutubeId")

module.exports = async ([observationEntry]) => {
    observationEntry.type = "segment"
    if (observationEntry instanceof Object) {
        observationEntry.videoId = extractYoutubeId(observationEntry.videoId)
    }
    // basic checks on the input
    let result = await validateObservation([observationEntry])
    if (result !== true) {
        throw Error(result)
    }
    let idForNewMoment = generateUuid()
    
    // set the new moment
    await mongoInterface.set({
        keyList: [ idForNewMoment ],
        from: "observations",
        to: {
            ...observationEntry,
            type: "segment",
        },
    })
    
    return idForNewMoment
}