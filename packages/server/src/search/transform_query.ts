import { strict as assert } from "node:assert";
import { DocSubtype, DocType, SearchQuery } from "@ipfs-search/api-types";

import { default as makeDebug } from "debug";
const debug = makeDebug("ipfs-search:transform_query");

// Unparsed queries from frontend.
const stringQueries = {
  Document:
    "metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword)",
  Audio: "metadata.Content-Type:(audio*)",
  Video: "metadata.Content-Type:(video*)",
  Image: "metadata.Content-Type:(image*)",
  Other:
    "NOT metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword OR audio* OR video* OR image*)",
} as const;

// Content types extracted from string queries.
type parsedQuery = {
  Input: string;
  ContentTypes: Set<string>;
  Negated: boolean;
};

// Example queries. Make sure to extract contenttypes well.
// const exampleQueries: string[] = [
//   "*",
//   "fiesta fantasico",
//   "NOT nfsw.classification.hentai:>0.15",
//   "last-seen:* nfsw.classification.hentai:<0.15 nfsw.classification.porn:<0.15 nfsw.classification.sexy:<0.3 metadata.Content-Type:(image*)",
//   "metadata.Content-Type:application/epub+zip language.language:af size:<=10485760 last-seen:[ now/d-30d TO *] metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword)",
//   "test last-seen:[ now/d-30d TO *] NOT metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword OR audio* OR video* OR image*)",
// ];

// Parse unparsed string query into Query.
function parseQuery(stringQuery: string): parsedQuery[] {
  // Allow for arbitrary stringQuery content before and after metadata.Content-Type filter and multiple matches.
  const regex = /(?<negate>NOT\s+)?metadata\.Content-Type:\((?<types>[^)]*)\)/g;
  const matches = [...stringQuery.matchAll(regex)];

  return matches.map((match) => {
    assert(match.input);
    assert(match.groups?.["types"]);
    const types = match.groups["types"].split("OR").map((t) => t.trim());

    return {
      Input: match.input,
      ContentTypes: new Set(types),
      Negated: !!match.groups["negate"],
    };
  });
}

function getQueryDocTypes(): [parsedQuery, DocSubtype[]][] {
  const queryDocTypes: Record<keyof typeof stringQueries, DocSubtype[]> = {
    Audio: [DocSubtype.Audio],
    Video: [DocSubtype.Video],
    Image: [DocSubtype.Image],
    Document: [DocSubtype.Document],
    Other: [
      // All remaining types.
      DocSubtype.Archive,
      DocSubtype.Unknown,
      DocSubtype.Data,
      DocSubtype.Other,
    ],
  };

  return Object.entries(queryDocTypes).map(([k, doctypes]) => {
    const stringQuery = stringQueries[k as keyof typeof stringQueries];
    const parsed = parseQuery(stringQuery);
    assert(parsed[0], `No parsed query found in ${parsed} for ${stringQuery}`);
    return [parsed[0], doctypes];
  });
}

const mappedQueryDocTypes = getQueryDocTypes();

// Get subtypes from query, allows for multiple matches or empty list if none match.
function getSubtypeFromQuery(q: SearchQuery): SearchQuery {
  const parsed = parseQuery(q.query);
  if (!parsed) {
    debug("Couldn't parse query");
    return q;
  }

  const subtypes: DocSubtype[] = [];

  for (const parsedQuery of parsed) {
    const { ContentTypes, Negated, Input } = parsedQuery;

    for (const [required, doctypes] of mappedQueryDocTypes) {
      if (ContentTypes.size < required.ContentTypes.size) {
        debug("Content type count doesn't match");
        continue;
      }

      // Everything in required types is present in parsed types.
      const typesMatch = [...required.ContentTypes].every((value) =>
        ContentTypes.has(value)
      );
      const negatedMatch = required.Negated === Negated;

      if (typesMatch && negatedMatch) {
        subtypes.push(...doctypes);
        q.query = q.query.replace(Input, "");

        debug("Matched", doctypes);
      }
    }
  }

  if (subtypes.length > 0) {
    q.subtypes = subtypes;
  }

  debug("Returning transformed", q);
  return q;
}

// TODO: Transform stuff like:
// metadata.title -> metadata.dc:title
// metadata.description -> metadata.dc:description

export class QueryTransformer {
  TransformQuery(q: SearchQuery): SearchQuery {
    debug("Transforming query", q);

    if (q.type === DocType.File && !q.subtypes?.length) {
      debug("Attempting to get subtypes from query");

      return getSubtypeFromQuery(q);
    }

    return q;
  }
}
