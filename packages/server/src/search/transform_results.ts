import { strict as assert } from "node:assert";
import type { SearchResult, SearchResultList } from "@ipfs-search/api-types";
import type {
  SearchHitsMetadata,
  SearchHit,
} from "@opensearch-project/opensearch/api/types";

function transformHit(hit: SearchHit): SearchResult {}

export default function transformHits(
  hits: SearchHitsMetadata
): SearchResultList {
  assert(typeof hits.total === "number");
  assert(hits.max_score);

  const results = hits.hits.map(transformHit);

  return {
    hits: results,
    total: hits.total,
    maxScore: hits.max_score,
  };
}
