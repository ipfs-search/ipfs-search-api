import esb from "elastic-builder";
import type { SearchQuery } from "@ipfs-search/api-types";
import { QueryFields } from "./queryfields.js";
import {
  DocumentField,
  DocumentNestedField,
  FlatFieldName,
  MetadataField,
  ReferenceField,
} from "./documentfields.js";
import { SourceFields } from "./source.js";

function queryStringQuery(q: string): esb.Query {
  console.log(q);

  return esb.queryStringQuery(q).defaultOperator("AND").fields(QueryFields);
}

enum period {
  month = "1M",
  week = "1w",
  day = "1d",
}

function lastSeen(term: period): esb.RangeQuery {
  return esb.rangeQuery(DocumentField.LastSeen).from(`now-${term}/h`);
}

function recent(q: esb.Query): esb.Query {
  return esb
    .functionScoreQuery()
    .query(q)
    .scoreMode("sum")
    .boostMode("multiply")
    .functions([
      esb.weightScoreFunction(1),
      esb.weightScoreFunction(1).filter(lastSeen(period.month)),
      esb.weightScoreFunction(1).filter(lastSeen(period.week)),
      esb.weightScoreFunction(1).filter(lastSeen(period.day)),
    ]);
}

function boostUnnamed(q: esb.Query): esb.BoostingQuery {
  return esb.boostingQuery(
    q,
    esb
      .boolQuery()
      .filter([
        esb.existsQuery(
          FlatFieldName([DocumentNestedField.Metadata, MetadataField.Title])
        ),
        esb.existsQuery(
          FlatFieldName([DocumentNestedField.References, ReferenceField.Name])
        ),
      ]),
    0.5
  );
}

function highlight(): esb.Highlight {
  return esb
    .highlight(QueryFields)
    .requireFieldMatch(false) // Content is not in source fields!
    .encoder("html")
    .numberOfFragments(1)
    .fragmentSize(250)
    .scoreOrder();
}

export default function getSearchQueryBody(
  q: SearchQuery
): esb.RequestBodySearch {
  console.log(q);
  const query = boostUnnamed(recent(queryStringQuery(q.query)));
  const pageSize = 15;

  return esb
    .requestBodySearch()
    .query(query)
    .highlight(highlight())
    .size(pageSize)
    .from(q.page * pageSize)
    .source(SourceFields);
}
