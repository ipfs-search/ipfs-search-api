# [ipfs-search.com](http://ipfs-search.com) search API server
[![Maintainability](https://api.codeclimate.com/v1/badges/0f36e7a852c0266fc6c6/maintainability)](https://codeclimate.com/github/ipfs-search/ipfs-search-api/maintainability)
[![Backers on Open Collective](https://opencollective.com/ipfs-search/backers/badge.svg)](#backers)
 [![Sponsors on Open Collective](https://opencollective.com/ipfs-search/sponsors/badge.svg)](#sponsors)

Microservice for searching the ipfs-search.com Elasticsearch index.

## API Spec
[![swagger-api validator-badge](https://validator.swagger.io/validator?url=https://raw.githubusercontent.com/ipfs-search/ipfs-search-api/master/openapi.yaml)](./openapi.yaml)

## Running
Open the [server](./server/) folder and run:
```shell
npm install
npm start
```

This will start an API server listening on port 9615, expecting Elasticsearh to be available on port 9200 on the localhost. A different Elasticsearch server can be configured by setting the `ELASTICSEARCH_URL` environment variables, like such:

```shell
env ELASTICSEARCH_URL=http://elasticsearch:9200 npm start
```

## Docker
The server can be run with Docker as follows:
```shell
docker build -t ipfs-search-api .
docker run -it ipfs-search-api
```
