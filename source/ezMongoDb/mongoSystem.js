// import project-specific tools
const fs = require("fs")
const mongoDb = require('mongodb')
const pathToCompressionMapping = `${__dirname}/compressionMapping.json`
const compressionMapping = require(pathToCompressionMapping)
// import some basic tools for object manipulation
const { recursivelyAllAttributesOf, get, set, merge, valueIs, checkIf } = require("good-js")


let databaseStartupCallbacks = []
module.exports = {
    databaseActions: [],
    hiddenKeys: Symbol.for("hiddenKeys"),

    async getDb() {
        let promise
        if (module.exports.connectToMongoDb.promise) {
            promise = module.exports.connectToMongoDb.promise
        } else {
            // since the connect function hasn't been called yet
            // use callbacks instead to wait on it to be called
            promise = new Promise((resolve, reject)=>{
                databaseStartupCallbacks.push(resolve)
            })
        }
        return (await promise).db
    },

    async connectToMongoDb({address, port, username, database, pathToMongoLock, fullUrl}) {
        let attemptConnection
        const mongoUrl = `mongodb://${address}:${port}/${username}/${database}`
        attemptConnection = async (resolve, reject)=>{
            try {
                let client = await mongoDb.MongoClient.connect(fullUrl||mongoUrl, {useUnifiedTopology: true})
                resolve({
                    client,
                    db: client.db(database),
                })
            } catch (error) {
                // if its a conntection issue retry
                if (error instanceof mongoDb.MongoNetworkError) {
                    console.log(`Unable to connect to mongodb (give it a few seconds), retrying in a few seconds`)
                    let sleepTime = 6 // seconds
                    setTimeout(() => {
                        // check if it is generateing a database
                        if (!fs.existsSync(pathToMongoLock)) {
                            console.log(`\n\nIt appears the mongodb database hasn't been setup yet\nthis is probably NOT a problem, I'm going to wait ${sleepTime} seconds and then check on the process again\n\nIf you see this message after several minutes of waiting, something is probably wrong\nit is likely that the volume that was supposed to be mounted\n    --volume FOLDER_WITH_YOUR_DATABASE:/data\nwas somehow not setup correctly (or maybe you never added that volume at all)\nBTW this check uses the /data/db/mongod.lock to confirm if the database exists`)
                        }
                        // try again
                        attemptConnection(resolve, reject)
                    }, sleepTime * 1000)
                } else {
                    reject(error)
                }
            }
        }
        // connect the variable before it has been waited on
        // this awkward little thing here is so that functions can wait on the db object even before this function has been called
        module.exports.connectToMongoDb.promise = new Promise(attemptConnection)
        let result = await module.exports.connectToMongoDb.promise
        databaseStartupCallbacks.forEach(each=>each(result))
        return result
    },
        
    // 
    // this function helps ensure that all the actions involving the database
    // are performed in FIFO order AND that each action is 100% finished
    // before the next database action is started
    // (if they're not done like this, then MongoDB gets mad and throws an error)
    // 
    addScheduledDatabaseAction(action) {
        return new Promise((resolve, reject)=>{
            // wrap the action to intercept the output, then put the wrapped func on the scheudler
            module.exports.databaseActions.push(async ()=>{
                try {
                    let output = await action()
                    resolve(output)
                    return output
                } catch (error) {
                    reject(error)
                    // intentionally don't fully throw
                    // because we want the executor to keep running
                }
            })
            
            // if there's executor processing the scheduled actions
            // then dont start a new one
            let self = module.exports.addScheduledDatabaseAction
            if (!self.databaseActionsAreBeingExecuted) {
                let theActionExecutor = async () => {
                    // if starting
                    self.databaseActionsAreBeingExecuted = true
                    // keep looping rather than iterating
                    // because more items are going to be added while
                    // eariler ones are being executed
                    while (true) {
                        let nextAction = databaseActions.shift()
                        if (nextAction === undefined) {
                            break
                        } else {
                            await nextAction()
                        }
                    }
                    // once all tasks are completed, turn the system off
                    self.databaseActionsAreBeingExecuted = false
                }
                // start the theActionExecutor (but don't wait for it to finish)
                // (although it wouldn't matter cause this is a promise)
                theActionExecutor()
            }
        })

    },
    
    // a very weak form of security
    // (we don't handle sensitive data, and don't want people to need to a login)
    // (just a key to keep out the port scanners, rando's, and worms)
    DATABASE_KEY: "4a75cfe3cdc1164b67aae6b413c9714280d2f102",
    processRequest(request) {
        // some very very very very very basic form of security
        if (request.body.key == module.exports.DATABASE_KEY) {
            return request.body.args 
        } else {
            throw new Error(`\n\nThe database got your request and parsed the json. However, it looked for an AUTH key and didn't find one (or didn't find a correct one). If you should be authorized to access this, then post an issue on https://github.com/jeff-hykin/iilvd_interface\n\nPOSTed data:\n${request.body}`)
        }
    },

    validateKeyList(keyList) {
        for (let eachIndex in keyList) {
            let eachKey = keyList[eachIndex]
            // convert numbers to strings
            if (valueIs(Number, eachKey)) {
                // mutate the list to convert numbers to strings
                keyList[eachIndex] = `${eachKey}`
            } else if (valueIs(String, eachKey)) {
                if (eachKey.match(/\$|\./)) {
                    throw new Error(`\n\nThere's a key ${keyList} being set that contains\neither a \$ or a \.\nThose are not allowed in MongoDB`)
                }
            } else {
                throw new Error(`\n\nThere's a key in ${keyList} and the value of it isn't a number or a string\n(which isn't allowed for a key)`)
            }
        }
        return keyList.join(".")
    },

    validateValue(valueObject) {
        if (valueObject instanceof Object) {
            for (let eachKeyList of recursivelyAllAttributesOf(valueObject)) {
                module.exports.validateKeyList(eachKeyList)
            }
        }
        return true
    },

    processKeySelectorList(keyList) {
        module.exports.validateKeyList(keyList)
        let id = { _id: keyList.shift() }
        keyList.unshift("_v")
        let valueKey = keyList.join(".")
        return [id, valueKey]
    },

    processAndEncodeKeySelectorList(keyList, hiddenKeyList) {
        if (hiddenKeyList) {
            keyList = hiddenKeyList
        }
        keyList = [...keyList]
        let idFilter = { _id: keyList.shift() }
        if (hiddenKeyList) {
            return [idFilter, keyList.join(".")]
        }
        let decodedKeyList = keyList.map(each=>module.exports.getEncodedKeyFor(each))
        return [idFilter, decodedKeyList.join(".")]
    },

    convertFilter(object) {
        if (!(object instanceof Object)) {
            return {}
        }

        // create a deep copy
        let filter = JSON.parse(JSON.stringify(object))

        // put "_v." in front of all keys being accessed by find
        for(let eachKey in filter) {
            if (typeof eachKey == 'string' && eachKey.length != 0) {
                // special keys start with $ and _
                if (eachKey[0] == '$' || eachKey[0] == '_') {
                    // dont delete it (do nothing)
                } else {
                    // create a new (corrected) key with the same value
                    filter['_v.'+eachKey] = filter[eachKey]
                    // remove the old key
                    delete filter[eachKey]
                }
            } else {
                // delete any random attributes tossed in here (Symbols)
                delete filter[eachKey]
            }
        }

        // TODO: should probably add a error for keys with underscores that are not _v or _id

        return filter
    },

    resultsToObject(results) {
        let actualResults = {}
        for (const each of results) {
            if (each._v) {
                let keyCount  = Object.keys(each._v).length
            }
            actualResults[each._id] = each._v
        }
        return actualResults
    },
    
    getEncodedKeyFor(string, saveToFile=true) {
        let originalKey = `${string}`
        let encodedKey = compressionMapping.getEncodedKeyFor[originalKey]
        if (encodedKey) {
            return encodedKey
        } else {

            // increase the index, use BigInt which has no upper bound
            // to save on string space, use the largest base conversion
            const maxAllowedNumberBaseConversion = 36
            compressionMapping.totalCount = BigInt(compressionMapping.totalCount)+1
            // need a two way mapping for incoming and outgoing data
            encodedKey = '@'+compressionMapping.totalCount.toString(maxAllowedNumberBaseConversion)
            compressionMapping.getOriginalKeyFor[encodedKey] = originalKey
            compressionMapping.getEncodedKeyFor[originalKey] = encodedKey
            if (saveToFile) {
                // save the new key to disk
                fs.writeFileSync(pathToCompressionMapping, JSON.stringify(compressionMapping))
            }
            return encodedKey
        }
    },

    getDecodedKeyFor(string, saveToFile=true) {
        let encodedKey = `${string}`
        let originalKey = compressionMapping.getOriginalKeyFor[encodedKey]
        if (originalKey) {
            return originalKey
        } else {
            throw Error(`Couldn't find decoded key for ${JSON.stringify(encodedKey)}`)
        }
    },

    encodeKeyList(keyList) {
        if (keyList instanceof Array) {
            return keyList.map(each=>module.exports.getEncodedKeyFor(each))
        } else {
            return null
        }
    },
    
    /**
     * Encode value to MongoDb safe form
     *
     * @param {any} dataValue ex: { thing: ['a', 'b', 'c'], hello: "world" }
     * @return {any} ex: { '@1': { 'size': 3, 'isArray':true, '1':'a', '2':'b', '3':'c' }, "@2": "world" }
     *
     * @example
     *     encodeValue({
     *         thing: ['a', 'b', 'c'],
     *         hello: "world"
     *     })
     *     // results in:
     *     // {
     *     //     "size": 2,
     *     //     "keys": [ '@1', '@2' ]
     *     //     '@1': {
     *     //         'size': 3,
     *     //         '1':'a',
     *     //         '2':'b',
     *     //         '3':'c'
     *     //     },
     *     //     "@2": "world",
     *     // }
     */
    encodeValue(dataValue, saveToFile=true) {
        let output = dataValue
        if (dataValue instanceof Object) {
            output = {}

            // record size
            let keys = Object.keys(dataValue)
            output.size = keys.length

            // init recording keys (if not array)
            let isAnArray = dataValue instanceof Array
            if (!isAnArray) {
                output.keys = []
            }

            for (let eachOriginalKey in dataValue) {
                // convert the key to an encoded value
                let encodedKey
                // no encoding needed for array indices
                if (isAnArray) {
                    encodedKey = eachOriginalKey
                // encode, then record key
                } else {
                    encodedKey = module.exports.getEncodedKeyFor(eachOriginalKey, saveToFile)
                    output.keys.push(encodedKey)
                }
                output[encodedKey] = module.exports.encodeValue(dataValue[eachOriginalKey], saveToFile)
            }
        }
        return output
    },

    decodeValue: (dataValue, saveToFile=true) => {
        let output = dataValue
        if (dataValue instanceof Object) {
            // 
            // figure out if array or object
            // 
            let isArray = null
            let size = checkIf({value:dataValue.size , is: Number}) && dataValue.size
            if (size && !checkIf({value: dataValue.keys, is: Array})) {
                isArray = true
            // if theres a size but no keys, then its an array
            // (note != false is important, otherwise size==0 will fail)
            } else if (size !== false) {
                isArray = false
            } else {
                let keys = Object.keys(dataValue)
                if (keys.length == 0) {
                    return {}
                // if has a numeric index
                } else if (keys.find(each=>each.match(/^\d+$/))) {
                    size = Math.max(...keys.filter(each=>each.match(/^\d+$/)))  +  1
                    isArray = true
                // otherwise assume object
                }
            }
            
            // 
            // handle objects
            // 
            if (!isArray) {
                output = {}
                for (let eachEncodedKey in dataValue) {
                    // if encoded key then decode and include it
                    if (checkIf({ value: eachEncodedKey, is: String }) && eachEncodedKey.match(/^@/)) {
                        let decodedKey = module.exports.getDecodedKeyFor(eachEncodedKey, saveToFile)
                        let decodedValue = module.exports.decodeValue(dataValue[eachEncodedKey], saveToFile)
                        // convert the key to an decodeValue
                        output[decodedKey] = decodedValue
                    }
                }
            // 
            // handle arrays
            // 
            } else {
                output = []
                start = -1
                while (++start < size) {
                    output[start] = module.exports.decodeValue(dataValue[start], saveToFile)
                }
            }
            // save the hiddenKeys for backend access
            output[module.exports.hiddenKeys] = dataValue
        }
        return output
    },
    
    /**
     * convertSearchFilter
     *
     * @param {Array} filters - an array with all elements being something like { valueOf: ["id234", "name"], is: "bob" }
     * @return {Object} the equivlent MongoDb query
     *
     * @example
     * convertSearchFilter([
     *    {
     *        valueOf: ["id234", "name"],
     *        is: "bob"
     *    },
     *    {
     *        valueOf: ["id234", "frame_count"],
     *        isLessThan: 15
     *    },
     *    {
     *        valueOf: ["id234", "name"],
     *        matches: "^Bob.*"
     *    },
     *    {
     *        sizeOf: ["id234",],
     *        isGreaterThan: 3
     *    },
     *    {
     *        hiddenValueOf: ["_id" ],
     *        matches: "^Bob.*"
     *    },
     * ])
     *     
     */
    convertSearchFilter(filters) {
        let mongoFilter = {}
        // TODO: add $or
        for (let eachFilter of filters) {
            let eachFilterKeys = Object.keys(eachFilter)

            // 
            // keylist
            // 
            let mongoKeyList
            if (eachFilterKeys.includes("hiddenValueOf")) {
                console.debug(`"hiddenValueOf" in eachFilter is:`,"hiddenValueOf" in eachFilter)
                mongoKeyList = eachFilter.hiddenValueOf.join(".")
            } else if (eachFilterKeys.includes("valueOf")) {
                console.debug(`"valueOf" in eachFilter is:`,"valueOf" in eachFilter)
                // TODO make sure valueOf is an Array
                mongoKeyList = module.exports.encodeKeyList(eachFilter.valueOf).join(".")
            } else if (eachFilterKeys.includes("sizeOf")) {
                console.debug(`"sizeOf" in eachFilter is:`,"valueOf" in eachFilter)
                mongoKeyList = module.exports.encodeKeyList(eachFilter.sizeOf).join(".") + ".size"
            } else if (eachFilterKeys.includes("keysOf")) {
                console.debug(`"keysOf" in eachFilter is:`,"keysOf" in eachFilter)
                mongoKeyList = module.exports.encodeKeyList(eachFilter.keysOf).join(".") + ".keys"
                // encode the values, otherwise the user will need to know the encoded values of keys
                // TODO: maybe in the future have the key list itself be stored decoded
                for (let eachPossibleValue in ["is","isNot","isOneOf","isNotOneOf"]) {
                    if (eachFilter[eachPossibleValue] instanceof Array) {
                        eachFilter[eachPossibleValue] = module.exports.encodeKeyList(eachFilter[eachPossibleValue])
                    }
                }
            } else {
                throw Error(` I was looking for "valueOf", "hiddenValueOf", "sizeOf", or "keysOf" but only found ${Object.keys(eachFilter)} in the filters:\n${JSON.stringify(filters,0,4)} `)
            }

            // ensure the filter exists
            if (!(mongoFilter[mongoKeyList] instanceof Object)) {
                mongoFilter[mongoKeyList] = {}
            }
            
            // 
            // operator
            // 
            if (eachFilterKeys.includes("exists")                ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$exists": eachFilter.exists              }}
            if (eachFilterKeys.includes("is")                    ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$eq": eachFilter.is                      }}
            if (eachFilterKeys.includes("isNot")                 ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$ne": eachFilter.isNot                   }}
            if (eachFilterKeys.includes("isOneOf")               ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$in": eachFilter.isOneOf                 }}
            if (eachFilterKeys.includes("isNotOneOf")            ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$nin": eachFilter.isNotOneOf             }}
            if (eachFilterKeys.includes("isLessThan")            ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$lt": eachFilter.isLessThan              }}
            if (eachFilterKeys.includes("isLessThanOrEqualTo")   ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$lte": eachFilter.isLessThanOrEqualTo    }}
            if (eachFilterKeys.includes("isGreaterThan")         ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$gt": eachFilter.isGreaterThan           }}
            if (eachFilterKeys.includes("isGreaterThanOrEqualTo")) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$gte": eachFilter.isGreaterThanOrEqualTo }}
            if (eachFilterKeys.includes("contains")              ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$elemMatch": eachFilter.contains         }}
            if (eachFilterKeys.includes("matches")               ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "$regex": eachFilter.matches              }}
            if (eachFilterKeys.includes("isNotEmpty")            ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "1": { "$exists": true }            }} // TODO: test me 
            if (eachFilterKeys.includes("isEmpty")               ) { mongoFilter[mongoKeyList] = { ...mongoFilter[mongoKeyList], "1": { "$exists": false }           }} // TODO: test me 
            
        }
        console.debug(`mongoFilter is:`,mongoFilter)
        return mongoFilter
    },

    // TODO: this is temporary, should be made programatically
    mongoInterfaceUnwrapper: {
        get:       (...args)=>module.exports.mongoInterface.get(...args[0]),
        set:       (...args)=>module.exports.mongoInterface.set(...args[0]),
        delete:    (...args)=>module.exports.mongoInterface.delete(...args[0]),
        merge:     (...args)=>module.exports.mongoInterface.merge(...args[0]),
        getAll:    (...args)=>module.exports.mongoInterface.getAll(...args[0]),
        deleteAll: (...args)=>module.exports.mongoInterface.deleteAll(...args[0]),
        length:    (...args)=>module.exports.mongoInterface.length(...args[0]),
    },

    mongoInterface: {
        async get({ keyList, hiddenKeyList, from, shouldntDecode }) {
            let db = await module.exports.getDb()
            let collection = checkIf({value: from, is: String}) ? db.collection(from) : from
            if (keyList && keyList.length == 0) {
                console.error("\n\nget: keyList was empty\n\n")
                return null
            } else {
                let [idFilter, encodedKeyListString] = module.exports.processAndEncodeKeySelectorList(keyList, hiddenKeyList)
                let output
                if (encodedKeyListString) {
                    output = await collection.findOne(idFilter, {projection: {[encodedKeyListString]:1}})
                } else {
                    output = await collection.findOne(idFilter)
                }
                let extractedValue = get({keyList:encodedKeyListString, from: output, failValue: null})
                if (shouldntDecode) {
                    return extractedValue
                } else {
                    return module.exports.decodeValue(extractedValue)
                }
            }
        },
        async set({ keyList, hiddenKeyList, from, to }) {
            let db = await module.exports.getDb()
            let collection = checkIf({value: from, is: String}) ? db.collection(from) : from
            if (keyList && keyList.length == 0) {
                console.error("\n\nset: keyList was empty\n\n")
                return null
            } else {
                if (hiddenKeyList) {
                    keyList = hiddenKeyList
                }
                var [idFilter, valueKey] = module.exports.processAndEncodeKeySelectorList(keyList, hiddenKeyList)
                // if top-level value
                if (keyList.length == 1) {
                    return await collection.updateOne(
                        idFilter,
                        {
                            $set: module.exports.encodeValue(to),
                        },
                        {
                            upsert: true, // create it if it doesnt exist
                        }
                    )
                } else {
                    return await collection.updateOne(
                        idFilter,
                        {
                            $set: { [valueKey]: module.exports.encodeValue(to) },
                        },
                        {
                            upsert: true, // create it if it doesnt exist
                        }
                    )
                }
            }
        },
        async delete({ keyList, hiddenKeyList, from }) {
            let db = await module.exports.getDb()
            let collection = checkIf({value: from, is: String}) ? db.collection(from) : from
            if (keyList && keyList.length == 0) {
                console.error("\n\ndelete: keyList was empty\n\n")
                return null
            } else {
                // argument processing
                let [idFilter, valueKey] = module.exports.processAndEncodeKeySelectorList(keyList, hiddenKeyList)
                // if deleting the whole element
                if (keyList.length == 1) {
                    return await collection.deleteOne(idFilter)
                } else if (keyList.length > 1) {
                    return await collection.updateOne(
                        idFilter,
                        {
                            $unset: { [valueKey]: "" },
                        }
                    )
                }
            }
        },
        async merge({ keyList, hiddenKeyList, from, to, shouldntDecode }) {
            if (keyList.length == 0) {
                console.error("\n\nmerge: keyList was empty\n\n")
                return null
            } else {
                let existingData = await module.exports.mongoInterface.get({ keyList, hiddenKeyList, from, shouldntDecode })
                // TODO: think about the consequences of overwriting array indices
                return await module.exports.mongoInterface.set({ keyList, hiddenKeyList, from, to: merge(existingData, to), shouldntDecode })
            }
        },

        /**
         * Search
         *
         * @name interface.getAll
         * @param {Object[]} args.where - A list of requirements
         * @param {Object[]} args.sortBy - See below for syntax
         * @param {Object[]} args.sample - how big of a random sample
         * @param {string[]} args.forEach.extract - A keyList
         * @param {string[]} args.forEach.extractHidden - A keyList
         * @param {string[][]} args.forEach.onlyKeep - A list of keyLists
         * @param {string[][]} args.forEach.exclude - A list of keyLists
         *
         * @return {Object[]} Array of results
         *
         * @example
         * let keyList1 = ["emails", 1, "sender"]
         * // (A.K.A) item.emails[1].sender
         * 
         * let keyList2 = ["emails", 1, "receiver"]
         * // (A.K.A) item.emails[1].receiver
         * 
         * getAll()
         * getAll({
         *   maxNumberOfResults: 10,
         *   where: [
         *     {
         *       valueOf: ["email"],
         *       is: "bob(At)gmail.com"
         *     },
         *     // (and)
         *     {
         *       valueOf: ["contact", "firstName"],
         *       is: "bob"
         *     },
         *   ],
         *   sortBy:[
         *     { keyList: keyList1, order: "smallestFirst"  },
         *     // sub-sort by:
         *     { keyList: keyList2, order: "largestFirst"  },
         *     // sub-sub-sort by:
         *     { keyList: keyList3, order: "largestFirst"  },
         *     // etc
         *   ],
         *   forEach: {
         *     extractHidden: ["_id"],
         *   }
         * })
         */
        async getAll({ where, forEach, maxNumberOfResults, sortBy, sample, from, shouldntDecode, returnObject }={}, { interativeRetrival }={}) {
            // TODO: add a forEach.get: sizeOf, keysOf, id
            let db = await module.exports.getDb()
            // 
            // process args
            // 
            let collection = checkIf({value: from, is: String}) ? db.collection(from) : from
            where = where||[]
            let { extract, onlyKeep, exclude } = forEach || {}
            
            let aggregationSteps = []
            
            // 
            // search filter
            // 
            if (where) {
                console.log(`calling convertSearchFilter`)
                let mongoSearchFilter = module.exports.convertSearchFilter(where)
                aggregationSteps.push({ $match: mongoSearchFilter })
            }

            if (forEach) {
                let {onlyKeep, exclude, extract, extractHidden} = forEach
                //
                // positive projection
                //
                let postiveProjection = {}
                let postiveProjectionExists = false
                if (onlyKeep instanceof Array) {
                    for (let each of onlyKeep.map(each=>module.exports.encodeKeyList(each))) {
                        postiveProjection[ each.join(".") ] = true
                        postiveProjectionExists = true
                    }
                }
                if (postiveProjectionExists) {
                    aggregationSteps.push({ $project: postiveProjection })
                }
                
                //
                // negative projection
                //
                let negativeProjection = {}
                let negativeProjectionExists = false
                if (exclude instanceof Array) {
                    for (let each of exclude.map(each=>module.exports.encodeKeyList(each))) {
                        negativeProjection[ each.join(".") ] = false
                        negativeProjectionExists = true
                    }
                }

                // 
                // mapper (extract + decode)
                // 
                var extractor
                if (extract instanceof Array && extract.length > 0) {
                    extractor = (each) => get({ keyList: module.exports.encodeKeyList(extract), from: each })
                }
                if (extractHidden instanceof Array && extractHidden.length > 0) {
                    extractor = (each) => get({ keyList: extractHidden, from: each })
                }
            }
            
            
            // 
            // limit
            // 
            if (maxNumberOfResults) {
                aggregationSteps.push({ $limit: maxNumberOfResults })
            }
            
            // 
            // sample
            // 
            if (sample) {
                aggregationSteps.push({ $sample: { size: sample } })
            }

            // 
            // sort 
            // 
            if (sortBy) {
                let sortObject = {}
                for (let each of sortBy) {
                    let keyList = module.exports.encodeKeyList(each.keyList)
                    keyList = keyList.join(".")
                    // TODO: add error handling here for poorly formatted input
                    sortObject[keyList] = each.order == "smallestFirst" ? 1 : -1
                }
                aggregationSteps.push({ $sort : sortObject })
                // TODO: get around memory limit problem
            }
            
            // 
            // get results
            // 
            let results
            if (interativeRetrival) {
                let result = await collection.aggregate(aggregationSteps)
                if (shouldntDecode) {
                    return result
                } else {
                    return {
                        ...result,
                        // wrap the forEach so that the values
                        // can be decoded
                        forEach: (aFunction)=>{
                            return result.forEach((value,...args)=>aFunction(module.exports.decodeValue(value), ...args))
                        },
                    }
                }
            } else {
                results = await collection.aggregate(aggregationSteps).toArray()
            }

            // 
            // map results
            // 
            let mapFunction
            if (shouldntDecode) {
                mapFunction = (each) => each
            } else {
                mapFunction = each=>module.exports.decodeValue(each)
            }
            let preDecodedResults = results
            if (extractor) {
                results = results.map(each=>mapFunction(extractor(each)))
            } else {
                results = results.map(mapFunction)
            }
            
            // convert to object if needed
            if (returnObject) {
                let output = {}
                for (let eachIndex in preDecodedResults) {
                    let id = preDecodedResults[eachIndex]._id
                    output[id] = results[eachIndex]
                }
                results = output
            }
            console.log(`returning getAll() results`)
            return results
            
            // TODO: should encodedExclusions apply locally

        },

        /**
         * @see interface.getAll
         */
        async deleteAll(...args) {
            let db = await module.exports.getDb()
            let collection = checkIf({value: args[0].from, is: String}) ? db.collection(args[0].from) : args[0].from
            // extract the ids
            args[0] = {...args[0], forEach: { extractHidden: ["_id"], } }
            let ids = await module.exports.mongoInterface.getAll(...args)
            await collection.deleteMany(
                {
                    _id: { "$in": ids },
                },
                {
                    writeConcern: {w: 0}, // 0 meaning, I don't care if the action happend RIGHT now 
                }
            )
        },
        
        /**
         * Function that returns how many documents there are
         *
         * @param {String} arg.of - name of the collection
         * @return {Number} the output is a
         *
         * @example
         * size({of: "observations"})
         * 
         */
        async length(arg) {
            return db.collection(arg.of).countDocuments()
        }
    },
}