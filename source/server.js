const express = require('express')
const bodyParser = require('body-parser')
const parameters = require('../package.json').parameters
const cors = require('cors')
const app = express()

app.use(cors())
app.use(bodyParser.json({limit: '50mb', extended: true}))

module.exports = {
    app,
    // async function that returns once server has started
    startServer: () => new Promise((resolve, reject)=>{
        app.listen(parameters.port, ()=>{
            console.log(`\n\n\n#\n# Database server is running\n#\n\n\n`)
            resolve(app)
        })
    })
}
