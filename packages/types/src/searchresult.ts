import type { CID } from "multiformats/cid";

export interface Reference {
  parentHash: CID;
  name: string;
}

export enum SearchResultType {
  File = "file",
  Directory = "directory",
}

export interface SearchResult {
  hash: CID;
  type: SearchResultType;
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

export enum SearchResultSubType {
  Archive = "archive",
  Audio = "audio",
  Data = "data",
  Document = "document",
  Image = "image",
  Other = "other",
  Unknown = "unknown",
  Video = "video",
}

export interface File extends SearchResult {
  type: SearchResultType.File;
  subtype?: SearchResultSubType;
  description?: string;
  mimetype?: string;
}

export interface Directory extends SearchResult {
  type: SearchResultType.Directory;
}
