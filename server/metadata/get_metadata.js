const client = require('../esclient');
const types = require('../types');

function process_results(results) {
  console.log(results)
  var new_results = results.body["_source"]

  // Add some metadata to the metadata
  new_results["version"] = results._version
  new_results["type"] = results._type

  return new_results
}

function getMetadata(cid) {
  // Perform the actual search
  return client.get({
    index: types.indexesFromType('file'),
    id: cid,
    _source: 'metadata,language,ipfs_tika_version'
  }).then(process_results);
}

module.exports = getMetadata;
