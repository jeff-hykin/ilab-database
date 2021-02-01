#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const { spawn, spawnSync } = require('child_process')
const { exitCode } = require("process")

const package = require("../../package.json")
const paths = package.parameters.paths

// remove tmp's leftovers
try { fs.unlinkSync("/tmp/mongodb-27017.sock") } catch (error) {}
try { fs.unlinkSync(paths.serverLog) } catch (error) {}

// 
// database process
// 
const startDatabaseProcess = ({enableRepair}) => {
    let args = ["--bind_ip", "127.0.0.1", "--dbpath", package.parameters.databaseSetup.databasePath]
    enableRepair && (args = ["--repair", ...args])
    console.log(`starting database serivce`)
    const process = spawn("mongod", args)
    process.stdout.on('data', (data)=>fs.appendFile(paths.serverLog, `${data}`, {}, ()=>0))
    process.stderr.on('data', (data)=>fs.appendFile(paths.serverLog, `ERR: ${data}`, {}, ()=>0))
    fs.writeFileSync(paths.mongoPid, `${process.pid}`)
    return new Promise((resolve, reject)=>{
        process.on('close', (exitCode)=>resolve(exitCode))
    })
}

// save for future reference
startDatabaseProcess({}).then( (exitCode) => {
    // if the server failed, restart and try to repair it
    if (exitCode != 0) {
        startDatabaseProcess({enableRepair: true})
    }
}).catch(e=>{
    console.debug(`e is:`,e)
})

// install/update everything
spawnSync("npm", ["install"], {stdio:'inherit'})

// start the express server
console.log(`starting express serivce`)
let process = spawn("npx", ["nodemon", paths.expressMain])
process.stdout.on('data', (data)=>fs.appendFile(paths.serverLog, `${data}`, {}, ()=>0))
process.stderr.on('data', (data)=>fs.appendFile(paths.serverLog, `ERR: ${data}`, {}, ()=>0))
process.on('close', (exitCode)=>exitCode)
fs.writeFileSync(paths.expressPid, `${process.pid}`)


module.exports = {
    paths
}