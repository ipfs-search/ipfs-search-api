import { strict as assert } from "node:assert";
import { DocSubtype } from "@ipfs-search/api-types";

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
function parseQuery(query: string): parsedQuery[] {
  // Allow for arbitrary query content before and after metadata.Content-Type filter and multiple matches.
  const regex = /(?'negate'NOT)? metadata\.Content-Type:\((?'types'[^)]*)\)/g;
  const matches = [...query.matchAll(regex)];

  return matches.map((match) => {
    assert(match.groups?.["types"]);
    const types = match.groups["types"].split("OR").map((t) => t.trim());

    return {
      ContentTypes: new Set(types),
      Negated: !!match.groups["negate"],
    };
  });
}

function getQueryDocTypes(): [parsedQuery, DocSubtype[]][] {
  const queryDocTypes: Record<keyof typeof stringQueries, DocSubtype[]> = {
    Document: [DocSubtype.Document],
    Audio: [DocSubtype.Audio],
    Video: [DocSubtype.Video],
    Image: [DocSubtype.Image],
    Other: [
      // All remaining types. TODO:
      DocSubtype.Archive,
      DocSubtype.Unknown,
      DocSubtype.Data,
      DocSubtype.Other,
    ],
  };

  return Object.entries(queryDocTypes).map(([query, doctypes]) => {
    const parsed = parseQuery(query);
    assert(parsed[0]);
    return [parsed[0], doctypes];
  });
}

const mappedQueryDocTypes = getQueryDocTypes();

// Get subtypes from query, allows for multiple matches or empty list if none match.
function getSubtypes(query: string): DocSubtype[] {
  const parsed = parseQuery(query);
  if (!parsed) return [];

  const subtypes: DocSubtype[] = [];

  for (const parsedQuery of parsed) {
    const { ContentTypes, Negated } = parsedQuery;

    for (const [required, doctypes] of mappedQueryDocTypes) {
      // Not enough fields to match.
      if (ContentTypes.size < required.ContentTypes.size) continue;

      // Everything in required types is present in parsed types.
      const typesMatch = [...required.ContentTypes].every((value) =>
        ContentTypes.has(value)
      );
      const negatedMatch = required.Negated === Negated;

      if (typesMatch && negatedMatch) subtypes.push(...doctypes);
    }
  }

  return subtypes;
}
