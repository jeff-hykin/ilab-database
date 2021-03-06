const levenshtein = require('js-levenshtein')

module.exports = ({ existingStrings, newString, closenessThreshold=1 }) => {
    for (let eachExistingString of existingStrings) {
        // if there is an exact match, then its directly refering to one that exists
        if (eachExistingString == newString) {
            return false
        }

        // if they only differ by a verison number, don't error
        // thing1 thing2
        if (eachExistingString.replace(/\d+$/, "") == newString.replace(/\d+$/, "")) {
            return false
        }

        // simplify
        simplifiedExistingString = eachExistingString.toLowerCase().replace(/_/, "-")
        simplifiedNewString = newString.toLowerCase().replace(/_/, "-")
        if (levenshtein(simplifiedExistingString, simplifiedNewString) <= closenessThreshold) {
            return eachExistingString
        }
    }
    return false
}



