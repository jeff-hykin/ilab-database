const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { smartEndpoints, collectionMethods, } = require("../endpoint_tools")
const validateObservation = require("../validate_observation")

module.exports = async ([observationEntry]) => {
    console.debug(`observationEntry is:`,observationEntry)
    // basic checks on the input
    let result = validateObservation(observationEntry)
    if (result !== true) {
        throw Error(result)
    }
    let idForNewMoment = generateUuid()
    
    // set the new moment
    await collectionMethods.set({
        keyList: [ idForNewMoment ],
        from: "observations",
        to: {
            ...observationEntry,
            type: "segment",
        },
    })
    
    return idForNewMoment
}