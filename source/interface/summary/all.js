const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const { mongoInterface, } = require("../ezMongoDb/mongoSystem")
const extractYoutubeId = require("../toolbox/extractYoutubeId")

module.exports = async ([filterAndSort]) => {
    observationEntry.type = "segment"
    if (observationEntry instanceof Object) {
        observationEntry.videoId = extractYoutubeId(observationEntry.videoId)
    }
    // basic checks on the input
    let result = await validateObservation([observationEntry])
    if (result !== true) {
        throw Error(result)
    }
    let idForNewMoment = generateUuid()
    
    // set the new moment
    await mongoInterface.set({
        keyList: [ idForNewMoment ],
        from: "observations",
        to: {
            ...observationEntry,
            type: "segment",
        },
    })
    
    return {  computeTime, results: { ...results,  usernames}, }
}

            let backend = await this.backend
            let where = []
            
            // 
            // build the backend query
            // 
            if (filterAndSort.labelName                            ) { where.push({ valueOf: ['observation', 'label'             ], is:                     filterAndSort.labelName         , }) }
            if (isNumber(filterAndSort.maxlabelConfidence)         ) { where.push({ valueOf: ['observation', 'labelConfidence'   ], isLessThanOrEqualTo:    filterAndSort.maxlabelConfidence, }) }
            if (isNumber(filterAndSort.minlabelConfidence)         ) { where.push({ valueOf: ['observation', 'labelConfidence'   ], isGreaterThanOrEqualTo: filterAndSort.minlabelConfidence, }) }
            if (filterAndSort.observer                             ) { where.push({ valueOf: ['observer'                         ], is:                     filterAndSort.observer          , }) }
            if (filterAndSort.kindOfObserver == "Only Humans"      ) { where.push({ valueOf: ['isHuman'                          ], is:                     true                          , }) }
            if (filterAndSort.kindOfObserver == "Only Robots"      ) { where.push({ valueOf: ['isHuman'                          ], is:                     false                         , }) }
            if (!filterAndSort.validation.includes("Confirmed")    ) { where.push({ valueOf: ['confirmedBySomeone'               ], isNot:                  true                          , }) }
            if (!filterAndSort.validation.includes("Rejected")     ) { where.push({ valueOf: ['rejectedBySomeone'                ], isNot:                  true                          , }) }
            // if (!filterAndSort.validation.includes("Unchecked")    ) { where.push({ valueOf: ['rejectedBySomeone'                ], is:                     false                         , }) 
            //                                                                       where.push({ valueOf: ['confirmedBySomeone'               ], is:                     false                         , }) }
            // if (!filterAndSort.validation.includes("Disagreement") ) { where.push({ valueOf: ['rejectedBySomeone'                ], isNot:                  true                          , }) 
            //                                                                       where.push({ valueOf: ['confirmedBySomeone'               ], isNot:                  true                          , }) }
            let observationEntries = await backend.mongoInterface.getAll({
                from: 'observations',
                where: [
                    { valueOf: ['type'], is:'segment' },
                    ...where,
                ]
            })
            
            // 
            // this looks like is does nothing but sadly it does
            // however it should be removed once the corrupt data from the database is fixed
            observationEntries = observationEntries.map(each => ({
                ...each,
                isHuman: each.isHuman == true,
                confirmedBySomeone: each.confirmedBySomeone == true,
                rejectedBySomeone: each.rejectedBySomeone == true,
            }))
            
            // this is so weird because of the dumb ways Javascript handles string->number
            // it behaves like if ($root.filterAndSort.minlabelConfidence) then min = $root.filterAndSort.minlabelConfidence
            let min = `${filterAndSort.minlabelConfidence}`; min = min.length>0 && isFinite(min-0) ? min-0 : -Infinity
            let max = `${filterAndSort.maxlabelConfidence}`; max = max.length>0 && isFinite(max-0) ? max-0 : Infinity
            // TODO: fix this, this is a patch/hack the backend should handle this
            observationEntries = observationEntries.filter(each => (each.observation.labelConfidence >= min) && (each.observation.labelConfidence <= max))
            // TODO: backend should be handling this too
            if (!filterAndSort.validation.includes("Unchecked")) {
                observationEntries = observationEntries.filter(each => each.confirmedBySomeone || each.rejectedBySomeone)
            }
            // TODO: backend should be handling this too
            if (!filterAndSort.validation.includes("Disagreement")) {
                observationEntries = observationEntries.filter(each => !(each.confirmedBySomeone && each.rejectedBySomeone))
            }
            
            console.debug(`observationEntries is:`,observationEntries)
            let results = {
                finishedComputing: true,
                uncheckedObservations: [],
                rejected: [],
                labels: {},
                observers: {},
                videos: new Set(),
                counts: {
                    total: observationEntries.length,
                    fromHuman: 0,
                    rejected: 0,
                    confirmed: 0,
                    disagreement: 0,
                },
            }
            for (let each of observationEntries) {
                if (!results.observers[each.observer]) { results.observers[each.observer] = 0 }
                results.observers[each.observer] += 1
                this.$root.usernames.add(each.observer)
                
                if (!results.labels[each.observation.label]) { results.labels[each.observation.label] = 0 }
                results.labels[each.observation.label] += 1
                
                results.videos.add(each.videoId)
                
                if (each.isHuman) {
                    results.counts.fromHuman += 1 
                } else {
                    if (each.confirmedBySomeone == true) {
                        results.counts.confirmed += 1
                    }
                    if (each.rejectedBySomeone == true) {
                        results.counts.rejected  += 1 
                        results.rejected.push(each)
                    }
                    if (each.rejectedBySomeone && each.confirmedBySomeone) {
                        results.counts.disagreement += 1
                    }
                    if (each.rejectedBySomeone !== true && each.confirmedBySomeone !== true) {
                        results.uncheckedObservations.push(each)
                    }
                }
            }