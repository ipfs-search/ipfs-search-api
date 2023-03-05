import type { CID } from "multiformats/cid";
import type { DocType, DocSubtype } from "./doctypes";

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
  hash: CID;
}
