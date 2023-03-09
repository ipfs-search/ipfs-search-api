import type { DocType, DocSubtype } from "./doctypes.js";

export interface Reference {
  parent_hash: string; // Note; divergence from OpenAPI spec!
  name: string;
}

export interface SearchResult {
  hash: string;
  type: DocType;
  title: string | undefined;
  author: string | undefined;
  creation_date: Date | undefined;
  size: number;
  "first-seen": Date | undefined; // Note; divergence from OpenAPI spec!
  "last-seen": Date | undefined; // Note; divergence from OpenAPI spec!
  score: number | undefined;
  references: Reference[] | undefined;
  subtype: DocSubtype | undefined;
  description: string | undefined;
  mimetype: string | undefined;
}

export interface SearchResultList {
  total: number;
  maxScore: number;
  hits: Array<SearchResult>;
}
