import type { CID } from "multiformats/cid";
import type { DocType, DocSubtype } from "./doctypes";

export interface Reference {
  parent_hash: CID; // Note; divergence from OpenAPI spec!
  name: string;
}

export interface SearchResult {
  hash: CID;
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
