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
import { default as downsize } from "downsize";
import { default as htmlEncode } from "js-htmlencode";
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

export type SearchResponse = SearchHitsMetadata<Source>;
export class ResultTransformer {
  aliasResolver: AliasResolver;

  // Settings
  resultDescriptionLength = 250;
  maxReferences = 8;

  constructor(aliasResolver: AliasResolver) {
    this.aliasResolver = aliasResolver;
  }

  TransformHits(hits: SearchResponse): SearchResultList {
    assert(typeof hits.total === "number");
    assert(hits.max_score);

    const results = hits.hits.map(this.transformHit);

    return {
      hits: results,
      total: hits.total,
      maxScore: hits.max_score,
    };
  }

  private getReference(r: SourceReference): Reference {
    assert(typeof r.name === "string");
    assert(typeof r.parent_hash === "string");

    return {
      name: r.name,
      parent_hash: CID.parse(r.parent_hash),
    };
  }

  private getReferences(refs: SourceReference[] | undefined): Reference[] {
    if (!refs) return [];

    return refs.slice(0, this.maxReferences).map(this.getReference);
  }

  private getSize(src: Source): number {
    const val = src[DocumentField.Size];
    assert(val === undefined || typeof val === "number");
    return val || 0;
  }

  private transformHit(hit: SearchHit<Source>): SearchResult {
    assert("_source" in hit);
    assert("_score" in hit);

    const result: SearchResult = {
      hash: CID.parse(hit._id),
      title: this.getTitle(hit),
      author: this.getAuthor(hit._source),
      creation_date: this.getCreationDate(hit._source),
      description: this.getDescription(hit),
      type: this.aliasResolver.GetDocType(hit._index),
      subtype: this.aliasResolver.GetDocSubtype(hit._index),
      size: this.getSize(hit._source),
      "first-seen": this.parseDate(hit._source[DocumentField.FirstSeen]),
      "last-seen": this.parseDate(hit._source[DocumentField.LastSeen]),
      score: hit._score,
      references: this.getReferences(hit._source.references),
      mimetype: this.getMimetype(hit._source),
    };

    return result;
  }

  // Return the first one from the priority list or null.
  private getTitlesFromHighlight(result: SearchHit<Source>): string[] {
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
  private getTitlesFromMetadata(src: Source): string[] {
    const titles: string[] = [];

    if ("metadata" in src) {
      const metadata_priority: MetadataKey[] = [MetadataField.Title];

      for (const f of metadata_priority) {
        const t = this.getMetadataField(src, f);
        if (t) titles.push(t);
      }
    }

    return titles;
  }

  // Attempt to get title from references.
  private getTitleReferences(src: Source): string[] {
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
  private getTitle(result: SearchHit<Source>): string | undefined {
    // Highlights take preference
    const titleHighlight = this.getTitlesFromHighlight(result);
    if (titleHighlight) {
      assert(titleHighlight[0]);
      return titleHighlight[0];
    }

    // Create array of all remaining titles
    const src = result._source;
    assert(src);
    const titleFuncs = [this.getTitlesFromMetadata, this.getTitleReferences];
    const titles = titleFuncs.reduce(
      (r, f) => r.concat(f(src)),
      [] as string[]
    );

    // Pick the longest title
    const longestTitle = titles.reduce((a, b) => (a.length > b.length ? a : b));

    if (longestTitle) return longestTitle;

    return undefined;
  }

  private getDescriptionFromHightlight(
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

  private getDescriptionFromMetadata(src: Source): string | undefined {
    const description = this.getMetadataField(src, MetadataField.Descripton);
    if (!description) return;

    return htmlEncode.htmlEncode(
      downsize(description, {
        characters: this.resultDescriptionLength,
        append: "...",
      })
    );
  }

  private getDescription(result: SearchHit<Source>): string | undefined {
    // Use highlights, if available
    const dHl = this.getDescriptionFromHightlight(result);
    if (dHl) return dHl;

    assert(result._source);
    const dMd = this.getDescriptionFromMetadata(result._source);
    if (dMd) return dMd;

    return undefined;
  }

  private getMimetype(src: Source): string | undefined {
    const type = this.getMetadataField(src, MetadataField.ContentType);
    if (!type) return;

    // "text/html; charset=ISO-8859-1" -> "text/html"
    const split = type.split(";", 1);

    assert(split[0]);
    return split[0];
  }

  private getAuthor(src: Source): string | undefined {
    return this.getMetadataField(src, MetadataField.Creator);
  }

  private getMetadataField(
    src: Source,
    field: MetadataKey
  ): string | undefined {
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

  private parseDate(i: unknown): Date | undefined {
    assert(typeof i == "string");
    if (i) return new Date(i);
    return;
  }

  private getCreationDate(src: Source): Date | undefined {
    return this.parseDate(this.getMetadataField(src, MetadataField.Created));
  }
}
