module.exports = function(newVideoId) {
    try {
        if (newVideoId.match(/.*www\.youtube\.com/)) {
            return newVideoId.match(/.+(?:\?|&)v=(.{11})/)[1]
        } else if (newVideoId.match(/.*youtu\.be\//)) {
            return newVideoId.match(/.*youtu.be\/(.{11})/)[1]
        }
    } catch (error) {}
    return newVideoId
}