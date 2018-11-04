/* jshint node: true, esnext: true */
'use strict';

const elasticsearch = require('elasticsearch');
const result_description_length = 250;

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});

function search(q, page, page_size) {
  var body = {
      "query": {
          "query_string": {
              "query": q,
              "default_operator": "AND"
          }
      },
      "highlight": {
          "order" : "score",
          "require_field_match": false,
          "encoder": "html",
          "fields": {
              "*": {
                  "number_of_fragments" : 1,
                  "fragment_size" : result_description_length
              }
          }
      },
      "_source": [
        "metadata.title", "metadata.name", "metadata.description",
        "references", "size", "last-seen", "first-seen"
      ]
  };

  return client.search({
    index: 'ipfs',
    body: body,
    size: page_size,
    from: page*page_size,
    timeout: '15s'
  });
}

module.exports = search;
