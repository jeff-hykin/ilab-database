let fs = require('fs')
let util = require('util')
let path = require('path')
const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)

module.exports = async function allFilesRecursively(directoryName) {
    let files = await readdir(directoryName)
    let allFiles = []
    // recursively explore the sub directories
    for (let each of files) {
        let fullPath = path.join(directoryName, each)
        let fileStats = await stat(fullPath)
        allFiles.push(fullPath)
        // explore all sub directories
        if (fileStats.isDirectory()) {
            allFiles = allFiles.concat(await allFilesRecursively(fullPath))
        }
    }
    return allFiles
}