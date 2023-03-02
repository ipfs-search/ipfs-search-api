import esb from "elastic-builder";
import type { SearchQuery } from "@ipfs-search/api-types";

// TODO: Update based on mapping.
const queryFields = [
  "_id^10",
  "metadata.identifier^10",
  "metadata.title^8",
  "metadata.dc:creator^8",
  "references.name^8",
  "metadata.subject^5",
  "metadata.xmpDM:album^5",
  "metadata.xmpDM:compilation^4",
  "metadata.description^3",
  "references.parent_hash^3",
  "links.Name^3",
  "links.Hash^2",
  "metadata.Content-Type^2",
  "content",
  "urls",
];

// TODO: Update based on mapping.
const srcFields = [
  "metadata.title",
  "metadata.dc:creator",
  "metadata.description",
  "metadata.Content-Type",
  "metadata.dcterms:created",
  "references",
  "size",
  "last-seen",
  "first-seen",
];

function queryStringQuery(q: string): esb.Query {
  return esb.queryStringQuery(q).defaultOperator("AND").fields(queryFields);
}

enum period {
  month = "1M",
  week = "1w",
  day = "1d",
}

function lastSeen(term: period): esb.RangeQuery {
  return esb.rangeQuery("last-seen").from(`now-${term}/h`);
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
    esb.boolQuery().filter([
      esb.existsQuery("metadata.title"), // Beware! 'title' changed!
      esb.existsQuery("references.Name"), // Shouldn't this be lower case?
    ])
  );
}

function highlight(): esb.Highlight {
  return esb
    .highlight(queryFields)
    .requireFieldMatch(false)
    .encoder("html")
    .numberOfFragments(1)
    .fragmentSize(250)
    .scoreOrder();
}

export default function getSearchQueryBody(
  q: SearchQuery
): esb.RequestBodySearch {
  const query = boostUnnamed(recent(queryStringQuery(q.query)));
  const pageSize = 15;

  return esb
    .requestBodySearch()
    .query(query)
    .highlight(highlight())
    .size(pageSize)
    .from(q.page * pageSize)
    .source(srcFields);
}
