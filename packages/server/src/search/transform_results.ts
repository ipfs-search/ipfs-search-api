import { strict as assert } from "node:assert";
import type {
  Reference,
  SearchResult,
  SearchResultList,
} from "@ipfs-search/api-types";
import type {
  SearchHitsMetadata,
  SearchHit,
} from "@opensearch-project/opensearch/api/types";
import { CID } from "multiformats";
import { default as downsize } from "downsize";
import { default as htmlEncode } from "js-htmlencode";
import type { AliasResolver } from "../common/indexalias";
import type { Reference as SourceReference, Source } from "./source";

export class ResultsTransformer {
  aliasResolver: AliasResolver;
  resultDescriptionLength = 250;
  maxReferences = 8;

  constructor(aliasResolver: AliasResolver) {
    this.aliasResolver = aliasResolver;
  }

  TransformHits(hits: SearchHitsMetadata<Source>): SearchResultList {
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
    return {
      name: r.name,
      parent_hash: CID.parse(r.parent_hash),
    };
  }

  private getReferences(refs: SourceReference[] | undefined): Reference[] {
    if (!refs) return [];

    return refs.slice(0, this.maxReferences).map(this.getReference);
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
      size: hit._source.size || 0,
      "first-seen": this.parseDate(hit._source["first-seen"]),
      "last-seen": this.parseDate(hit._source["first-seen"]),
      score: hit._score,
      references: this.getReferences(hit._source.references),
      mimetype: this.getMimetype(hit._source),
    };

    return result;
  }

  // Return the first one from the priority list or null.
  private getTitlesFromHighlight(result: SearchHit<Source>): string[] {
    const highlight_priorities = ["metadata.title", "references.name"];

    if (result.highlight) {
      for (const f of highlight_priorities) {
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
      const metadata_priority: MetadataKey[] = ["title", "name"];

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
      if (hl["content"]) {
        assert(hl["content"][0]);
        return hl["content"][0];
      }

      if (hl["links.Name"]) {
        // Reference name matching
        return `Links to &ldquo;${hl["links.Name"][0]}&rdquo;`;
      }

      if (hl["links.Hash"]) {
        // Reference name matching
        return `Links to &ldquo;${hl["links.Hash"][0]}&rdquo;`;
      }
    }

    return undefined;
  }

  private getDescriptionFromMetadata(src: Source): string | undefined {
    const description = this.getMetadataField(src, "description");
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
    const type = this.getMetadataField(src, "Content-Type");
    if (!type) return;

    // "text/html; charset=ISO-8859-1" -> "text/html"
    const split = type.split(";", 1);

    assert(split[0]);
    return split[0];
  }

  private getAuthor(src: Source): string | undefined {
    return this.getMetadataField(src, "dc:creator");
  }

  private getMetadataField(
    src: Source,
    field: MetadataKey
  ): string | undefined {
    const v = src?.metadata?.[field];

    if (v instanceof Array) {
      assert(v.length > 0);
      return v[0];
    }

    return v;
  }

  private parseDate(i: string | undefined): Date | undefined {
    if (i) return new Date(i);
    return;
  }

  private getCreationDate(src: Source): Date | undefined {
    return this.parseDate(this.getMetadataField(src, "dcterms:created"));
  }
}
