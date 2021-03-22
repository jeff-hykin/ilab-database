((async ()=>{
    while (1) {
        await new Promise((resolve, reject)=>{
            setTimeout(resolve, 1000)
        })
    }
})())