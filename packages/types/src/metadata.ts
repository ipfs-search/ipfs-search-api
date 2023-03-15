import type { DocType, DocSubtype } from "./doctypes.js";

export interface Metadata {
  [propName: string]: unknown;
}

export interface MetadataResult {
  metadata: Metadata;
  version: number;
  type: DocType.File;
  subtype: DocSubtype;
}

export interface MetadataQuery {
  hash: string;
}
