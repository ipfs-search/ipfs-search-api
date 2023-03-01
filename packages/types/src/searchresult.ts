import type { CID } from "multiformats/cid";
import type { DocType, DocSubtype } from "./doctypes";

export interface Reference {
  parentHash: CID;
  name: string;
}

export interface SearchResult {
  hash: CID;
  type: DocType;
  title?: string;
  author?: string;
  creation_date: Date;
  size: number;
  firstSeen: Date;
  lastSeen: Date;
  score: number;
  references?: Array<Reference>;
}

export interface SearchResultList {
  total: number;
  maxScore: number;
  hits: Array<SearchResult>;
}

export interface File extends SearchResult {
  type: DocType.File;
  subtype?: DocSubtype;
  description?: string;
  mimetype?: string;
}

export interface Directory extends SearchResult {
  type: DocType.Directory;
}
