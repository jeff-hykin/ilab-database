const { recursivelyAllAttributesOf, get, merge, valueIs, logBlock, dynamicSort, checkIf, requireThat } = require("good-js")
const { v4: generateUuid } = require('uuid')
const _ = require("lodash")
const { mongoInterface, } = require("../../ezMongoDb/mongoSystem")
const extractYoutubeId = require("../../toolbox/extractYoutubeId")

const cache = {
    debounceTime: 1, // seconds
    lastOutput: undefined,
    lastOutputTime: -Infinity,
}

module.exports = async ([filterAndSort]) => {
    // 
    // debouncer
    // 
    const now = (new Date()).getTime()
    if (now < (cache.debounceTime*1000 + cache.lastOutputTime)) {
        return cache.lastOutput
    } else {
        cache.lastOutputTime = now
    }

    console.debug(`filterAndSort is:`,filterAndSort)
    let where = []
            
    // 
    // build the query
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


    let observationIterator = await mongoInterface.getAll({
        from: 'observations',
        where: [
            { valueOf: ['type'], is:'segment' },
            ...where,
        ],
    }, {interativeRetrival: true})
    
    let results = {
        finishedComputing: true,
        uncheckedObservations: [],
        rejected: [],
        labels: {},
        observers: {},
        usernames: new Set(),
        videos: {},
        counts: {
            total: 0,
            fromHuman: 0,
            rejected: 0,
            confirmed: 0,
            disagreement: 0,
        },
    }
    // 
    // this section should be rewritten to use the search^ instead of Javascript filters
    // 
    const ignoresUnchecked = !filterAndSort.validation.includes("Unchecked")
    const ignoresDisagreement = !filterAndSort.validation.includes("Disagreement")
    // this is so weird because of the dumb ways Javascript handles string->number
    // it behaves like if ($root.filterAndSort.minlabelConfidence) then min = $root.filterAndSort.minlabelConfidence
    let min = `${filterAndSort.minlabelConfidence}`; min = min.length>0 && isFinite(min-0) ? min-0 : -Infinity
    let max = `${filterAndSort.maxlabelConfidence}`; max = max.length>0 && isFinite(max-0) ? max-0 : Infinity
    await observationIterator.forEach(each => {
        console.debug(`[observationIterator] each is:`,each)
        // filters 
        if ((each.observation.labelConfidence >= min) && (each.observation.labelConfidence <= max)) { return }
        if (ignoresUnchecked && (each.confirmedBySomeone || each.rejectedBySomeone)) { return }
        if (ignoresUnchecked && (!(each.confirmedBySomeone && each.rejectedBySomeone))) { return }

        // 
        // this section is actual logic
        // 
        
        // count observations for observers
        if (!results.observers[each.observer]) { results.observers[each.observer] = 0 }
        results.observers[each.observer] += 1
        
        // count observations for labels
        if (!results.labels[each.observation.label]) { results.labels[each.observation.label] = 0 }
        results.labels[each.observation.label] += 1
        
        // count observations for videos
        if (!results.videos[each.videoId]) { results.videos[each.videoId] = 0 }
        results.videos[each.videoId] += 1
        
        results.counts.total += 1
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
    })
    
    // save result for later
    cache.lastOutput = results // part of debouncer
    console.debug(`results is:`,results)
    return results
}
