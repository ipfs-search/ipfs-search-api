const client = require('../esclient');
const types = require('../types');
const query = require('./query');

const typeRe = /_type:(\w+)/;

// Legacy wrapper to extract type from _type in q
function typeFromQ(q) {
  const matches = q.match(typeRe);

  if (matches) {
    return {
      qType: matches[1],
      qWithoutType:
        q.substring(0, matches.index - 1)
        + q.substring(matches.index + matches[0].length),
    };
  }

  return {
    qType: null,
    qWithoutType: q,
  };
}

function search(q, type, page, pageSize, preference) {
  const { qType, qWithoutType } = typeFromQ(q);

  const body = {
    query: query.boostUnnamed(
      query.recent(
        query.string(qWithoutType, query.queryFields),
      ),
    ),
    highlight: {
      order: 'score',
      require_field_match: false,
      encoder: 'html',
      fields: {
        '*': {
          number_of_fragments: 1,
          fragment_size: 250,
        },
      },
    },
    _source: query.sourceFields,
  };

  return client.search({
    index: types.indexesFromType(type || qType),
    body,
    size: pageSize,
    from: page * pageSize,

    // Optimizations
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html#shard-and-node-preference
    max_concurrent_shard_requests: 24, // Defines the number of concurrent shard requests per node this search executes concurrently. This value should be used to limit the impact of the search on the cluster in order to limit the number of concurrent shard requests. Defaults to 5.
    pre_filter_shard_size: 2048,
    preference: '_local',
    // timeout: '800ms', // Specifies the period of time to wait for a response from each shard. If no response is received before the timeout expires, the request fails and returns an error.
    // allow_partial_search_results: true, // If true, returns partial results if there are shard request timeouts or shard failures. If false, returns an error with no partial results.
    // ignore_unavailable: true, // If false, the request returns an error if it targets a missing or closed index.
  });
}

module.exports = search;
