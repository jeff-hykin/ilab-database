// 
// generates video entries for all the old video formats
// 
// this is a temporary function and should be deleted once the conversion is made
async function convertVersion1ToVersion2(id) {
    
    // TODO: improve this by adding a return value filter
    let oldValue = await mainCollection.findOne({_id: id})
    try {
        console.debug(`oldValue._v.basic_info is:`,oldValue._v.basic_info)
    } catch (e) {

    }

    // skip the id if it doesn't have any data
    if (
            !(oldValue instanceof Object)
        || !(oldValue._v instanceof Object)
        ||  (Object.keys(oldValue._v).length <= 0)
    ) {
        return null
    } else {
        oldValue = oldValue._v
    }

    let newValue = {
        summary: {
            id: id,
            title: null,
            source: "youtube", // hash this value on the way in, unhash it on way out
            duration: null,    // might be updated later in this func
            creator: null,
        },
        largeMetadata: {},
        relatedVideos: {}, // might be updated later in this func
        videoFormats: [],  // might be updated later in this func
        processes: {
            incomplete:{}, // might be updated later in this func
            completed:{},
        },
    }
    
    // 
    // summary.duration
    // 
    newValue.duration = get({keyList: ["basic_info", "duration"], from: oldValue})

    // 
    // relatedVideos
    // 
    let relatedVideos = oldValue.related_videos
    if (relatedVideos instanceof Object) {
        if (Object.keys(relatedVideos).length > 0) {
            for (let eachKey in relatedVideos) {
                // make sure all of them are dictionaries
                newValue.relatedVideos[eachKey] = {}
            }
        }
    }

    // 
    // videoFormats
    // 
    let framesExist = oldValue.frames instanceof Object && Object.keys(oldValue.frames).length > 0
    let hasFaces = false
    if (framesExist) {
        let newFormat = {
            height: oldValue.basic_info.height,
            width: oldValue.basic_info.width,
            fileExtension: "mp4",
            framerate: null,                    // the current fps values that are saved are unreliable
            totalNumberOfFrames: null,          // because of failed processes, the total number of frames isn't reliable
        }            
        for (const [eachKey, eachValue] of Object.entries(oldValue.frames)) {
            let faces = eachValue["faces_haarcascade_0-0-2"]
            if (eachValue["faces_haarcascade_0-0-2"] instanceof Array) {
                hasFaces = true
                break
            }
        }
        newValue.videoFormats.push(newFormat)
    }
    console.debug(`hasFaces is:`,hasFaces)

    // 
    // processes
    // 
    if (hasFaces) {
        // incomplete because its not known that any of them finished
        newValue.processes.incomplete["faces-haarcascade-v1"] = true
    }
    
    let { functions } = require("./interfaces/videos")
    module.exports.interface.set({
        keyList:[ id ],
        from: 'videos',
        to: newValue
    })
    console.log(`video set`)
    return newValue
}