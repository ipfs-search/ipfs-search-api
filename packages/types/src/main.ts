// This is really just a CID.
export interface Hash {}

// export enum Type {
//   Any = <any>"any",
//   File = <any>"file",
//   Directory = <any>"directory",
// }
export enum IndexType {
  Archive = "ipfs_archives",
  Audio = "ipfs_audio",
  Data = "ipfs_data",
  Directory = "ipfs_directories",
  Document = "ipfs_documents",
  Image = "ipfs_images",
  Other = "ipfs_other",
  Unknown = "ipfs_unknown",
  Video = "ipfs_videos",
}

export enum QueryType {
  ResultType,
  File = "file",
  Directory = "directory",
  Any = "any",
}

export interface Metadata {
  metadata?: object;
  version?: number;
  type?: Type;
}

export interface Reference {
  parentHash: Hash;
  name: string;
}

export interface SearchQuery {
  query: string;
  type?: Type | "any";
  page?: number;
}

export interface SearchResult {
  hash: Hash;
  title?: string;
  description?: string;
  type?: Type;
  size?: number;
  firstSeen?: string;
  lastSeen?: string;
  score: number;
  references?: Array<Reference>;
  mimetype?: string;
}

export interface SearchResultList {
  total: number;
  maxScore: number;
  hits: Array<SearchResult>;
}
