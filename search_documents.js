const { Client } = require('@elastic/elasticsearch');

const types = require('./types');
const query = require('./query');

const client = new Client({
  node: 'http://localhost:9200',
  log: 'info',
});

function search(q, page, pageSize) {
  const body = {
    query: {
      bool: {
        filter: {
          terms: { 'metadata.Content-Type': query.mimeTypes.document },
        },
        must: query.boostUnnamed(
          query.recent(
            query.string(q, query.queryFields),
          ),
        ),
      },
    },
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
    index: types.indexesFromType('file'),
    body,
    size: pageSize,
    from: page * pageSize,
    timeout: '15s',
  });
}

module.exports = search;
