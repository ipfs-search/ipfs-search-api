import { strict as assert } from "node:assert";
import type {
  DocSubtype,
  DocType,
  Reference,
  SearchResult,
  SearchResultList,
} from "@ipfs-search/api-types";
import type {
  SearchHit,
  SearchHitsMetadata,
} from "@opensearch-project/opensearch/api/types.js";
import { CID } from "multiformats";
import downsize from "downsize";
import htmlEncode from "js-htmlencode";
import type {
  Reference as SourceReference,
  Source,
  Metadata,
} from "../../source.js";
import {
  DocumentField,
  DocumentNestedField,
  FlatFieldName,
  LinksField,
  MetadataField,
  ReferenceField,
} from "../../documentfields.js";
import { default as makeDebug } from "debug";
import { HighlightFields } from "../../queryfields.js";
import conf from "../../../common/conf.js";

const debug = makeDebug("ipfs-search:transform_results");

type MetadataKey = keyof Metadata;

const resultDescriptionLength = 250;
const maxReferences = 8;

const flatTitleFieldName = FlatFieldName([
    DocumentNestedField.Metadata,
    MetadataField.Title,
  ]),
  flatReferenceFieldName = FlatFieldName([
    DocumentNestedField.References,
    ReferenceField.Name,
  ]),
  flatLinkFieldNames = [
    FlatFieldName([DocumentNestedField.Links, LinksField.Name]),
    FlatFieldName([DocumentNestedField.Links, LinksField.Hash]),
  ];

function getDescriptionFromHighlight(
  result: SearchHit<Source>
): string | undefined {
  // No highlight, early return.
  if (!result.highlight) return;

  for (const f of HighlightFields) {
    // Skip title .
    if (f === flatTitleFieldName) continue;

    const h = result.highlight[f];
    if (h) {
      debug("Description highlight", h, f);
      assert(h[0]);

      // Reference name matching
      if (flatLinkFieldNames.includes(f)) {
        return `Links to &ldquo;${h[0]}&rdquo;`;
      }
      return h[0];
    }
  }

  return;
}

// Return the first one from the priority list or null.
function getTitlesFromHighlight(result: SearchHit<Source>): string[] {
  // No highlight, early return.
  if (!result.highlight) [];

  if (result.highlight) {
    for (const f of [flatTitleFieldName, flatReferenceFieldName]) {
      const h = result.highlight[f];

      if (h) {
        return h;
      }
    }
  }

  return [];
}

// Attempt to get title from metadata.
function getTitlesFromMetadata(src: Source): string[] {
  const titles: string[] = [];

  if ("metadata" in src) {
    const metadata_priority: MetadataKey[] = [MetadataField.Title];

    for (const f of metadata_priority) {
      const t = getMetadataField(src, f);
      if (t) titles.push(t);
    }
  }

  return titles;
}

function isCID(v: string): boolean {
  // asCID isn't behaving well, try this way...
  try {
    CID.parse(v);
    return true;
  } catch (e) {
    return false;
  }
}

// Attempt to get title from references.
function getTitleFromReferences(src: Source): string[] {
  if (!src.references) return [];
  assert(Array.isArray(src.references));

  return src.references
    .filter((i) => i && i.name && i.name.length > 1 && !isCID(i.name))
    .map((i) => i.name as string);
}

// Get title from result
function getTitle(result: SearchHit<Source>): string | undefined {
  // Highlights take preference
  const titleHighlight = getTitlesFromHighlight(result);
  if (titleHighlight.length > 0) {
    return titleHighlight[0];
  }

  // Create array of all remaining titles
  const src = result._source;
  assert(src);
  const titleFuncs = [getTitlesFromMetadata, getTitleFromReferences];
  const titlesLs = titleFuncs.map((f) => f(src));
  const titles = titlesLs.flat();
  if (titles.length === 0) return undefined;

  // Pick the longest title
  const longestTitle = titles.reduce((a, b) => (a.length > b.length ? a : b));

  return longestTitle;
}

function getDescriptionFromMetadata(src: Source): string | undefined {
  const description = getMetadataField(src, MetadataField.Descripton);
  if (!description) return;

  return htmlEncode.htmlEncode(
    downsize(description, {
      characters: resultDescriptionLength,
      append: "...",
    })
  );
}

function getDescription(result: SearchHit<Source>): string | undefined {
  // Use highlights, if available
  const dHl = getDescriptionFromHighlight(result);
  if (dHl) {
    debug("Returning description from highlight", dHl);
    return dHl;
  }

  assert(result._source);
  const dMd = getDescriptionFromMetadata(result._source);
  if (dMd) return dMd;

  return undefined;
}

function getMimetype(src: Source): string | undefined {
  const type = getMetadataField(src, MetadataField.ContentType);
  if (!type) return;

  // "text/html; charset=ISO-8859-1" -> "text/html"
  const split = type.split(";", 1);

  assert(split[0]);
  return split[0];
}

function getAuthor(src: Source): string | undefined {
  return getMetadataField(src, MetadataField.Creator);
}

function getMetadataField(src: Source, field: MetadataKey): string | undefined {
  const v = src?.metadata?.[field];

  if (v instanceof Array) {
    assert(v.length > 0);
    const av = v[0];
    if (typeof av === "number") {
      return av.toString();
    }

    return av;
  }

  if (typeof v === "number") {
    return v.toString();
  }

  return v;
}

function parseDate(i: unknown): Date | undefined {
  if (i) {
    assert(typeof i === "string", `${i} is not a string but ${typeof i}`);
    return new Date(i);
  }
  return;
}

function getCreationDate(src: Source): Date | undefined {
  return parseDate(getMetadataField(src, MetadataField.Created));
}

function getReference(r: SourceReference): Reference {
  assert(typeof r.name === "string");
  assert(typeof r.parent_hash === "string");

  return {
    name: r.name,
    parent_hash: CID.parse(r.parent_hash).toV1().toString(),
  };
}

function getReferences(refs: SourceReference[] | undefined): Reference[] {
  if (!refs) return [];

  return refs.slice(0, maxReferences).map(getReference);
}

function getSize(src: Source): number {
  const val = src[DocumentField.Size];
  assert(val === undefined || typeof val === "number");
  return val || 0;
}

interface AliasResolver {
  GetDocType(index: string): Promise<[DocType, DocSubtype?]>;
}

export class ResultTransformer {
  aliasResolver: AliasResolver;

  constructor(aliasResolver: AliasResolver) {
    this.aliasResolver = aliasResolver;
  }

  async TransformHits(
    hits: SearchHitsMetadata<Source>
  ): Promise<SearchResultList> {
    assert(typeof hits.total === "number");

    // Do this in a for loop to prevent resolving aliases in parallel and that's the only blocking operation here..
    const results: SearchResult[] = new Array(hits.hits.length);
    for (const [index, hit] of hits.hits.entries()) {
      results[index] = await this.transformHit(hit);
      debug("Transformed", hit, "into", results[index]);
      debug(hit._source?.metadata);
    }

    return {
      hits: results,
      page_size: conf.pageSize,
      page_count: Math.ceil(hits.total / conf.pageSize),
      total: hits.total,
      maxScore: hits.max_score || 0,
    };
  }

  private async transformHit(
    this: this,
    hit: SearchHit<Source>
  ): Promise<SearchResult> {
    assert("_source" in hit);
    assert("_score" in hit);

    const [type, subtype] = await this.aliasResolver.GetDocType(hit._index);

    const result: SearchResult = {
      hash: CID.parse(
        typeof hit._source.cid === "string" ? hit._source.cid : hit._id
      )
        .toV1()
        .toString(), // Fallback to _id for directories.
      title: getTitle(hit),
      author: getAuthor(hit._source),
      creation_date: getCreationDate(hit._source),
      description: getDescription(hit),
      size: getSize(hit._source),
      "first-seen": parseDate(hit._source[DocumentField.FirstSeen]),
      "last-seen": parseDate(hit._source[DocumentField.LastSeen]),
      score: hit._score,
      references: getReferences(hit._source.references),
      mimetype: getMimetype(hit._source),
      type,
      subtype,
    };

    return result;
  }
}
