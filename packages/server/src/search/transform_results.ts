import { strict as assert } from "node:assert";
import type {
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
import type { AliasResolver } from "../common/indexalias.js";
import type { Reference as SourceReference, Source } from "./source.js";
import {
  DocumentField,
  DocumentNestedField,
  FlatFieldName,
  LinksField,
  MetadataField,
  ReferenceField,
} from "./documentfields.js";

type MetadataKey = keyof Source["metadata"];

const resultDescriptionLength = 250;
const maxReferences = 8;

// Return the first one from the priority list or null.
function getTitlesFromHighlight(result: SearchHit<Source>): string[] {
  const metadataFields = [MetadataField.Title].map((f) =>
    FlatFieldName([DocumentNestedField.Metadata, f])
  );
  const referencesFields = [ReferenceField.Name].map((f) =>
    FlatFieldName([DocumentNestedField.References, f])
  );
  const highlightFields: string[] = metadataFields.concat(referencesFields);

  if (result.highlight) {
    for (const f of highlightFields) {
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

// Attempt to get title from references.
function getTitleReferences(src: Source): string[] {
  const titles: string[] = [];

  if (src.references) {
    src.references.forEach((item) => {
      if (item.name && item.name.length > 1) {
        // TODO: Skip references names which are CID's.
        titles.push(item.name);
      }
    });
  }

  return titles;
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
  const titleFuncs = [getTitlesFromMetadata, getTitleReferences];
  const titlesLs = titleFuncs.map((f) => f(src));
  console.log("titlesLs", titlesLs);
  const titles = titlesLs.flat();
  console.log("titles", titles);
  if (titles.length === 0) return undefined;

  // Pick the longest title
  const longestTitle = titles.reduce((a, b) => (a.length > b.length ? a : b));

  return longestTitle;
}

function getDescriptionFromHightlight(
  result: SearchHit<Source>
): string | undefined {
  const hl = result.highlight;

  if (hl) {
    const content = hl[DocumentField.Content];
    if (content) {
      assert(content[0]);
      return content[0];
    }

    const linkName =
      hl[FlatFieldName([DocumentNestedField.Links, LinksField.Name])];
    if (linkName) {
      // Reference name matching
      return `Links to &ldquo;${linkName[0]}&rdquo;`;
    }

    const linkHash =
      hl[FlatFieldName([DocumentNestedField.Links, LinksField.Hash])];
    if (linkHash) {
      // Reference name matching
      return `Links to &ldquo;${linkHash[0]}&rdquo;`;
    }
  }

  return undefined;
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
  const dHl = getDescriptionFromHightlight(result);
  if (dHl) return dHl;

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
    parent_hash: CID.parse(r.parent_hash),
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

export class ResultTransformer {
  aliasResolver: AliasResolver;

  constructor(aliasResolver: AliasResolver) {
    this.aliasResolver = aliasResolver;
  }

  async TransformHits(
    hits: SearchHitsMetadata<Source>
  ): Promise<SearchResultList> {
    assert(typeof hits.total === "number");
    assert(hits.max_score);

    // Do this in a for loop to prevent resolving aliases in parallel and that's the only blocking operation here..
    const results: SearchResult[] = new Array(hits.hits.length);
    for (const [index, hit] of hits.hits.entries()) {
      results[index] = await this.transformHit(hit);
    }

    return {
      hits: results,
      total: hits.total,
      maxScore: hits.max_score,
    };
  }

  private async transformHit(
    this: this,
    hit: SearchHit<Source>
  ): Promise<SearchResult> {
    assert("_source" in hit);
    assert("_score" in hit);
    assert(typeof hit._source.cid === "string");

    const result: SearchResult = {
      hash: CID.parse(hit._source.cid),
      title: getTitle(hit),
      author: getAuthor(hit._source),
      creation_date: getCreationDate(hit._source),
      description: getDescription(hit),
      type: await this.aliasResolver.GetDocType(hit._index),
      subtype: await this.aliasResolver.GetDocSubtype(hit._index),
      size: getSize(hit._source),
      "first-seen": parseDate(hit._source[DocumentField.FirstSeen]),
      "last-seen": parseDate(hit._source[DocumentField.LastSeen]),
      score: hit._score,
      references: getReferences(hit._source.references),
      mimetype: getMimetype(hit._source),
    };

    return result;
  }
}
