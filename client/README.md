# [ipfs-search.com](http://ipfs-search.com) search API client
[![Backers on Open Collective](https://opencollective.com/ipfs-search/backers/badge.svg)](#backers)
 [![Sponsors on Open Collective](https://opencollective.com/ipfs-search/sponsors/badge.svg)](#sponsors)

Official TypeScript/JavaScript client for https://api.ipfs-search.com/, generated based on the [OpenAPI 3.0](../openapi.yaml) definition.

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition should be automatically resolved via `package.json`. ([Reference](http://www.typescriptlang.org/docs/handbook/typings-for-npm-packages.html))

### Installing
```
npm install ipfs-search-client
```

### Usage
#### Search
```javascript
const IpfsSearchApi = require('ipfs-search-client').DefaultApi();

const q = 'water'; // {{String}} Search string query, based on Elasticsearch's [Query string query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-dsl-query-string-query) syntax.
const opts = {
  type: 'any', // {{Type}} Resource type. Omit to return all types.
  page: 0, // {{Integer}} Page number.
};

const callback = (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: {data}');
  }
};

IpfsSearchApi.searchGet(q, opts, callback);
```

#### Metadata
```javascript
const IpfsSearchApi = require('ipfs-search-client').DefaultApi();

const hash = 'QmcDCte64xtxqTVzdWnT5MG9yi3dFsNuLZjAyess4RJFWc'; // {{String}} IPLD Content ID (CID).

const callback = (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: {data}');
  }
};

IpfsSearchApi.metadatahashGet(hash, callback);
```

### Building

To build an compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run ```npm publish```
