import { strict as assert } from "node:assert";
import { default as makeDebugger } from "debug";
import type { SearchQuery, SearchResultList } from "@ipfs-search/api-types";
import type { Client } from "@opensearch-project/opensearch";
import type { SearchResponse } from "@opensearch-project/opensearch/api/types.js";
import { AliasResolver } from "../common/indexalias.js";
import getSearchQueryBody from "./query.js";
import type { Source } from "./source.js";
import { QueryTransformer } from "./transform_query.js";
import { ResultTransformer } from "./transform_results.js";
// import conf from "../common/conf.js";

const debug = makeDebugger("ipfs-search:search");

export class Searcher {
  client: Client;
  aliasResolver: AliasResolver;
  queryTransformer: QueryTransformer;
  resultTransformer: ResultTransformer;

  constructor(client: Client) {
    this.client = client;
    this.aliasResolver = new AliasResolver(client);
    this.resultTransformer = new ResultTransformer(this.aliasResolver);
    this.queryTransformer = new QueryTransformer();
  }

  async search(q: SearchQuery): Promise<SearchResultList> {
    const indexes = this.aliasResolver.GetIndexAliases(q.type, q.subtypes);
    assert(indexes.length, "No indexes to search for.");
    debug("indexes", indexes);

    const newq = this.queryTransformer.TransformQuery(q);

    const body = getSearchQueryBody(newq).toJSON();
    debug("Query:", body);

    const resp = await this.client.search<SearchResponse<Source>>({
      index: indexes,
      body: body,

      // Optimizations
      // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html#shard-and-node-preference
      // max_concurrent_shard_requests: 24, // Defines the number of concurrent shard requests per node this search executes concurrently. This value should be used to limit the impact of the search on the cluster in order to limit the number of concurrent shard requests. Defaults to 5.
      // pre_filter_shard_size: 2048,
      preference: "_local",

      // Turn this on once we hit production.
      // timeout: conf.shardTimeout, // Specifies the period of time to wait for a response from each shard. If no response is received before the timeout expires, the request fails and returns an error.
      // allow_partial_search_results: true, // If true, returns partial results if there are shard request timeouts or shard failures. If false, returns an error with no partial results.

      rest_total_hits_as_int: true,
    });

    return this.resultTransformer.TransformHits(resp.body.hits);
  }
}
