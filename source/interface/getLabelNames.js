const { mongoInterface } = require("../ezMongoDb/mongoSystem.js")

module.exports =  async () => {
    let observationIterator = await mongoInterface.getAll({
        from: 'observations',
        forEach: {
            extract: [ "observation", "label" ],
        }
    }, {interativeRetrival: true})
    
    // start summarizing the data
    let labelNames = new Set()
    // count the label for each
    await observationIterator.forEach(labelName => {
        if (typeof labelName === 'string' && labelName.length > 0) {
            labelNames.add(labelName)
        }
    })
    
    return [...labelNames]
}