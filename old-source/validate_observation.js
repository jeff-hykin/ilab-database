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
    }
    return true
}