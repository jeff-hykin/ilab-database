const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const validateObservation = require("../toolbox/validateObservation")
const extractYoutubeId = require("../toolbox/extractYoutubeId")

module.exports = async ([observationEntry]) => {
    // perform id extraction before check
    if (observationEntry instanceof Object) {
        observationEntry.videoId = extractYoutubeId(observationEntry.videoId)
    }
    // 
    // Check data
    // 
    let result = validateObservation(observationEntry)
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
        },
    })
    
    return idForNewMoment
}