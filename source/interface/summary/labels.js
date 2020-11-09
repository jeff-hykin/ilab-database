// import library tools
const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
// import project-specific tools
const { mongoInterface, } = require("../../ezMongoDb/mongoSystem.js")

module.exports =  async ({ keyList }) => {
    let observationIterator = await mongoInterface.all({
        from: 'observations',
        where: [
            {
                valueOf: ["type"],
                is: "segment",
            }
        ]
    }, {interativeRetrival: true})
    
    // start summarizing the data
    let results = {}
    let videosWithLabels = new Set()
    // count the label for each
    await observationIterator.forEach(eachObservationEntry=> {
        videosWithLabels.add(eachObservationEntry.videoId)
        if (eachObservationEntry.observation instanceof Object) {
            // init
            if (!(eachObservationEntry.observation.label in results)) {
                results[eachObservationEntry.observation.label] = {}
                results[eachObservationEntry.observation.label].videos = {[eachObservationEntry.videoId]: 1}
                results[eachObservationEntry.observation.label].segmentCount = 1
            // update
            } else {
                results[eachObservationEntry.observation.label].videos[eachObservationEntry.videoId] += 1
                results[eachObservationEntry.observation.label].segmentCount += 1
            }
        }
    })
    
    // generate videoCount
    for (const [key, value] of Object.entries(results)) {
        // record length
        value.videoCount = Object.keys(value.videos).length
        // sort by segment count (split into [keys, values], then sort by value (e.g. 1))
        value.videos = Object.fromEntries(Object.entries(value.videos).sort(dynamicSort([1], true)))
    }

    // 
    // show how many videos don't have any segments
    // 
    // TODO: create one to show videos that have unlabelled segments
    let videosWithoutLabels = await mongoInterface.all({
        from:"videos",
        where: [
            {
                hiddenValueOf: [ "_id" ],
                isNotOneOf: [...videosWithLabels]
            }
        ],
        forEach: {
            extractHidden: [ "_id" ]
        },
    })
    results["(No Segments)"] = {
        color: "gray",
        videos: Object.fromEntries([...videosWithoutLabels].map(each=>[each, 1])),
        videoCount: videosWithoutLabels.length,
        segmentCount: 0,
    }
    results["Neutral"] || (results["Neutral"]={})
    results["Neutral"].color = "darkgray"
    
    results["Uncertain"] || (results["Uncertain"]={})
    results["Uncertain"].color = "gray"

    // sort results by largest segmentCount
    results = Object.fromEntries(Object.entries(results).sort(dynamicSort([1, "segmentCount"], true)))
    return results
}