const isIPFS = require('is-ipfs')

function validate(cid) {
  // Validate cid, true for valid, false for invalid
  return isIPFS.cid(cid)
}

module.exports = {
  Validate: validate,
}
