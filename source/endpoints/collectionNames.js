module.exports = async ()=>{
    return (await db.listCollections({},{}).toArray()).map(each=>each.name)
}