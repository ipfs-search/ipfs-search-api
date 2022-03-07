const { Client } = require("@opensearch-project/opensearch");

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

console.info(`Connecting to Elasticsearch at '${ELASTICSEARCH_URL}'`);

module.exports = new Client({
  node: ELASTICSEARCH_URL,
  log: 'info',
});
