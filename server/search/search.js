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
    timeout: '15s',
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html#shard-and-node-preference
    preference: preference,
  });
}

module.exports = search;
