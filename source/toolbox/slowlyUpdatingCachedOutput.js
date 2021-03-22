module.exports = ({coreFunction, refreshTimeSeconds}) => {
    const cache = {
        refreshTimeSeconds, // seconds
        lastOutput: undefined,
        lastOutputTime: -Infinity,
    }

    return (...args) => {
        // 
        // short circut when inside the time limit
        // 
        const now = (new Date()).getTime()
        if (now < (cache.refreshTimeSeconds*1000 + cache.lastOutputTime)) {
            return cache.lastOutput
        } else {
            cache.lastOutputTime = now
        }
        
        let output = coreFunction(...args)

        // 
        // save output for later
        // 
        // save result for later
        cache.lastOutput = output
        // update it again encase the operation takes a long time
        cache.lastOutputTime = (new Date()).getTime()
        return output
    }
}
