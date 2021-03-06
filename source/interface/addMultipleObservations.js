const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const addObservation = require("./addObservation")
const validateObservation = require("./validateObservation")

module.exports = async ([newObservations]) => {
    // first check all the values before adding any of them
    for (const [eachIndex, eachValue] of Object.entries(newObservations)) {
        let result = await validateObservation([eachValue])
        if (result !== true) {
            throw Error(`For item # ${eachIndex}, `+result)
        }
    }
    
    // then add all of them one by one
    let newUuids = []
    for (let each of newObservations) {
        newUuids.push(await addObservation([each]))
    }
    
    return newUuids
}