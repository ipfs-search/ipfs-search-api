import type { SearchQuery } from "@ipfs-search/api-types";

import { default as makeDebug } from "debug";
import TransformMetadataFieldNames from "./transform_fieldnames.js";
import GetSubtypeFromQuery from "./transform_getsubtypes.js";
const debug = makeDebug("ipfs-search:transform_query");

type transformFunc = (q: SearchQuery) => SearchQuery;

const queryTransformers: transformFunc[] = [
  GetSubtypeFromQuery,
  TransformMetadataFieldNames,
];

export class QueryTransformer {
  TransformQuery(q: SearchQuery): SearchQuery {
    debug("Transforming query", q);

    let newq = q;
    for (const t of queryTransformers) {
      newq = t(newq);
    }

    return newq;
  }
}
