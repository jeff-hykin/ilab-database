const { mongoInterface } = require("../ezMongoDb/mongoSystem.js")

module.exports =  async () => {
    let observationIterator = await mongoInterface.getAll({
        from: 'observations',
        forEach: {
            extract: [ "observer" ],
        }
    }, {interativeRetrival: true})
    
    // start summarizing the data
    let usernames = new Set()
    // count the label for each
    await observationIterator.forEach(username => {
        if (typeof username === 'string' && username.length > 0) {
            usernames.add(username)
        }
    })
    
    return [...usernames]
}