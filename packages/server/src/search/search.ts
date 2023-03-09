import type { SearchQuery, SearchResultList } from "@ipfs-search/api-types";
import type { Client } from "@opensearch-project/opensearch";
import { AliasResolver } from "../common/indexalias.js";
import getSearchQueryBody from "./query.js";
import { ResultTransformer, SearchResponse } from "./transform_results.js";

export class Searcher {
  client: Client;
  aliasResolver: AliasResolver;
  resultTransformer: ResultTransformer;

  constructor(client: Client) {
    this.client = client;

    this.aliasResolver = new AliasResolver(client);
    this.resultTransformer = new ResultTransformer(this.aliasResolver);
  }

  async search(q: SearchQuery): Promise<SearchResultList> {
    const indexes = this.aliasResolver.GetIndexAliases(q.type, q.subtype);

    const body = getSearchQueryBody(q).toJSON();

    const resp = await this.client.search<SearchResponse>({
      index: indexes,
      body: body,

      // Optimizations
      // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html#shard-and-node-preference
      max_concurrent_shard_requests: 24, // Defines the number of concurrent shard requests per node this search executes concurrently. This value should be used to limit the impact of the search on the cluster in order to limit the number of concurrent shard requests. Defaults to 5.
      pre_filter_shard_size: 2048,
      preference: "_local",
      // timeout: '800ms', // Specifies the period of time to wait for a response from each shard. If no response is received before the timeout expires, the request fails and returns an error.
      // allow_partial_search_results: true, // If true, returns partial results if there are shard request timeouts or shard failures. If false, returns an error with no partial results.
      // ignore_unavailable: true, // If false, the request returns an error if it targets a missing or closed index.

      rest_total_hits_as_int: true,
    });

    return this.resultTransformer.TransformHits(resp.body);
  }
}
