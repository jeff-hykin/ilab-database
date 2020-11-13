const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
/**
 * Function
 *
 * @param {Object} observation
 * @return {Boolean|String} true if valid, string-error if invalid
 *
 */
module.exports = (observation)=>{
    if (!(observation instanceof Object)) {return `observations need to be an object/dictionary. Instead a ${observation} was received`}
    if (observation.type == "segment") {
        if (!checkIf({value: observation.videoId,     is: String})) { return `\`videoId\` should be the id (string) of for the video. Instead it was ${observation.videoId}` }
        if (!checkIf({value: observation.startTime,   is: Number})) { return `The \`startTime\` should be an float (seconds). Instead it was ${observation.startTime}`       }
        if (!checkIf({value: observation.endTime,     is: Number})) { return `The \`endTime\` should be an float (seconds). Instead it was ${observation.endTime}`           }
        if (!checkIf({value: observation.observer,    is: String})) { return `\`observer\` should be a unique id for what process/human created the data. Instead it was ${observation.observer}` }
        if (!checkIf({value: observation.observation, is: Object})) { return `\`observation\` should be an object/dictionary. Instead it was ${observation.observation}` }
        if (observation.startTime >= observation.endTime) {return `the observation \`startTime\` is ≥ \`endTime\` (that shouldn't be possible). They are probably just flipped.\n startTime:${observation.startTime}, endTime:${observation.endTime}\n\nIf you want them to be equal, make the endTime larger by a very very very small amount (ex: less than 1/60th of a second for a 60fps video)` }
        if (observation.startTime < 0) { return `the observation \`startTime\` is negative... (that shouldn't be possible). startTime:${observation.startTime}` }
        if (observation.endTime   < 0) { return `the observation \`endTime\` is negative... (that shouldn't be possible). endTime:${observation.endTime}` }
        // TODO: remove this once video ids not on youtube are allowed
        if (observation.videoId.length == 11) { return `\`videoId\` isn't 11 characters long, so I don't think its a valid youtube id. The id was: ${observation.videoId}` }
    // TODO: this will be changed in the future to allow more types
    } else {
        return `\`type\` should be "segment", however instead it was ${observation.type}`
    }
    return true
}