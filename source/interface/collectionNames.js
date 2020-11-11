const { getDb } = require("../ezMongoDb/mongoSystem")

module.exports = async ()=>{
    return (await (await getDb()).listCollections({},{}).toArray()).map(each=>each.name)
}