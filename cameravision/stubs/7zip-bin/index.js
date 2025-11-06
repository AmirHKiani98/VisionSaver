const path = require("path")

function getPath() {
    return "7za"
}
exports.path7za = getPath()
exports.path7x = path.join(__dirname, "7x.sh")