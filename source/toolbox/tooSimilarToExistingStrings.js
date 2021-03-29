const levenshtein = require('js-levenshtein')

modules.export = ({ existingStrings, newString, closenessThreshold=2 }) => {
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
        eachExistingString = eachExistingString.toLowerCase().replace(/_/, "-")
        simplifiedNewString = newString.toLowerCase().replace(/_/, "-")
        if (levenshtein(eachExistingString, simplifiedNewString) <= closenessThreshold) {
            return true
        }
    }
    return false
}



