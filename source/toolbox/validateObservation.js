let didYouMean = require("didyoumean")

const getUsernames = require("../interface/getUsernames")
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")

// TODO: attempt auto-detection of duplicate upload values

function nonEmptyStringCheck(name, value) {
    if (typeof value !== "string") {
        throw Error(`\`${name}\` isn't a string, instead it is a ${typeof value}, with a value of: ${JSON.stringify(value)}`)
    } else if (value.length === 0) {
        throw Error(`\`${name}\` is an empty string, which isn't allowed`)
    }
}

function properNumberCheck(name, value) {
    if (typeof value !== 'number') {
        throw Error(`\`${name}\` isn't a number, instead it is a ${typeof value}, with a value of: ${JSON.stringify(value)}`)
    // this is only true for NaN
    } else if (value !== value) {
        throw Error(`\`${name}\` isn't a number, instead had a value of NaN`)
    }
}

function booleanishCheck(name, value) {
    if (value === false || value === null || value === undefined || value === true) {
        throw Error(`\`${name}\` exists and isn't boolean, instead it had a type of ${typeof value} with a value of ${JSON.stringify(value)} `)
    }
}

function checkVideoId(observation) {
    if (typeof observation.videoId !== 'string') {
        throw Error(`\`videoId\` should be the id (string) of for the video. Instead it was ${observation.videoId}`)
    }
    // TODO: remove this once video ids not on youtube are allowed
    if (observation.videoId.length != 11) {
        throw Error(`\`videoId\` isn't 11 characters long, so I don't think its a valid youtube id. The id was: ${observation.videoId}`)
    }
}

function checkStartAndEndTime(observation) {
    properNumberCheck("startTime", observation.startTime)
    properNumberCheck("endTime", observation.endTime)
    // both non-negative
    if (observation.startTime < 0) {
        throw Error(`the observation \`startTime\` is negative... (that shouldn't be possible). startTime:${observation.startTime}`)
    }
    if (observation.endTime < 0) {
        throw Error(`the observation \`endTime\` is negative... (that shouldn't be possible). endTime:${observation.endTime}`)
    }
    // start greater than end
    if (observation.startTime >= observation.endTime) {
        throw Error(`the observation \`startTime\` is ≥ \`endTime\` (that shouldn't be possible). They are probably just flipped.\n startTime:${observation.startTime}, endTime:${observation.endTime}\n\nIf you want them to be equal, make the endTime larger by a very very very small amount (ex: less than 1/60th of a second for a 60fps video)`)
    }
    // TODO: check that end time is not longer than the duration of the video
}

function checkObservation(observationEntry) {
    let observation = observationEntry.observation
    if (!(observation instanceof Object)) {
        throw Error(`Each observationEntry should have an \`observation\` object. Instead that value was ${JSON.stringify(observation)}`)
    }

    //
    // check label
    //
    let pattern = /^[a-zA-Z0-9\-_\.]+$/
    nonEmptyStringCheck("observation.label", observation.label)
    if (!observation.label.match(pattern)) {
        throw Error(`The observationEntry's \`observation.label\` does not meet the requirements of ${pattern}\nIn English that should mean only letters, numbers, underscores, dashs, and periods`)
    }

    //
    // check labelConfidence
    //
    let labelConfidence = observation.labelConfidence
    if (!(labelConfidence === null || labelConfidence === undefined)) {
        properNumberCheck("observation.labelConfidence", labelConfidence)
        if (labelConfidence > 1 || labelConfidence < -1) {
            throw Error(`The observationEntry's \`observation.labelConfidence\` is ${labelConfidence}, which is outside the bounds of 1 and -1.\n\nFor reference, 1 means confident enough to bet $100,000 that the label is correct\n\n-1 means confident enough to bet $100,000 that the label is NOT correct. 0 means total uncertainity`)
        }
    }
}

const observerNames = []
const observerCache = {}
async function checkObserver(observation) {
    nonEmptyStringCheck(observation.observer)
    let username = observation.observer
    let pattern = /^[a-zA-Z0-9_\-.@]+$/
    if (!username.match(pattern)) {
        throw Error(`the observation \`observer\` does not meet the requirements of ${pattern}\nIn English that should mean only letters, numbers, underscores, dashs, periods and at-symbols`)
    }
    
    // 
    // name similarity check
    // 
    if (observerNames.length == 0) {
        observerNames = await getUsernames()
    }
    if (!observerNames.includes(username)) {
        let potentialMisname = didYouMean(username, observerNames)
        if (potentialMisname instanceof Array) {
            potentialMisname = potentialMisname[0]
        }
        if (typeof potentialMisname == "string" && potentialMisname.length > 0) {
            // if they are similar, but not the same
            if (potentialMisname !== username) {
                throw Error(`the observation's \`observer\` is similar to the existing username ${potentialMisname} to avoid accidents. If you created that name, please use it instead of ${username}. If you did not create that name, please choose a new name that is significantly different from it`)
            }
        }
    }
    observerNames.add(username)
    
    // 
    // make sure the observer is either human or machine, but not both
    // 
    if (observerCache[username] !== undefined) {
        let existing = new Set(await mongoInterface.getAll({
            from: "observations",
            where: [
                {
                    valueOf: ["observer"],
                    is: username
                },
            ],
            forEach: {
                extract: ["isHuman"],
            }
        }))
        let hasTrue  = true  in existing
        let hasFalse = false in existing
        let hasNull  = null  in existing
        let copy = new Set(existing); copy.delete(true); copy.delete(false); copy.delete(null)
        if (copy.size > 0 || (hasTrue && (hasFalse||hasNull))) {
            console.error(`#\n#\n# Corrupt isHuman data for user ${username}, isHuman values: ${existing}\n#\n#\n`)

            // TODO: potentially make this throw an error
            observerCache[username] = null
        } else {
            if (existing.size === 0) {
                observerCache[username] = null
            } else if (hasTrue) {
                observerCache[username] = true
            } else {
                observerCache[username] = false
            }
        }
    }
    
    // this should mean this is the first time the user has made an observation
    // (or some data in the data in the database is corrupt)
    if (observerCache[username] === null) {
        // use the current value
        observerCache[username] = observation.isHuman === true
    } else {
        let existingOneIsHuman = observerCache[username] === true
        let newOneIsHuman = observation.isHuman === true
        if (existingOneIsHuman !== newOneIsHuman) {
            throw Error(`the \`observer\` ${username} is listed on this observation with isHuman: ${JSON.stringify(observation.isHuman)}, however in the database that same username is being used where the isHuman is disagrees. Its possible the previously uploaded data is wrong, the being-uploaded data is wrong, or someone else was using your username before you. Please use the search-by-username to figure what happened and correct it.`)
        }
    }
    
}

/**
 * Function
 *
 * @param {Object} observationEntry
 * @return {Boolean|String} true if valid, string-error if invalid
 *
 */
module.exports = async (observationEntry) => {
    // 
    // basic check
    // 
    if (!(observationEntry instanceof Object)) {
        return `observationEntries need to be an object/dictionary. Instead a ${observationEntry} was received`
    }
    if (observationEntry.type !== "segment" && observationEntry.type !== "video") {
        return `\`type\` should be "segment" or "video", however instead it was ${JSON.stringify(observationEntry.type)}`
    }
    
    try {
        checkVideoId(observationEntry)
        booleanishCheck("isHuman", observationEntry.isHuman)
        booleanishCheck("confirmedBySomeone", observationEntry.confirmedBySomeone)
        booleanishCheck("rejectedBySomeone", observationEntry.rejectedBySomeone)
        await checkObserver(observationEntry)
        checkObservation(observationEntry)
    
        if (observationEntry.type == "segment") {
            checkStartAndEndTime(observationEntry)
        }
    } catch (error) {
        return error.message
    }

    return true
}