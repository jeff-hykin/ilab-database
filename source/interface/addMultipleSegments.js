const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat, indent } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const addSegmentObservation = require("./addSegmentObservation")
const validateObservation = require("../toolbox/validateObservation")

module.exports = async ([newSegements]) => {
    // first check all the values before adding any of them
    let index = -1
    for (let each of newSegements) {
        index++
        each.type = "segment"
        let result = validateObservation(each)
        if (result !== true) {
            throw Error(`For item # ${index}, `+result)
        }
    }
    // then add all of them one by one
    let newUuids = []
    for (let each of newSegements) {
        newUuids.push(await addSegmentObservation([each]))
    }
    
    return newUuids
}