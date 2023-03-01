import type { CID } from "multiformats/cid";
import type { DocType, DocSubtype } from "./doctypes";

export interface MetadataResult {
  metadata: object;
  version: number;
  type: DocType.File;
  subtype: DocSubtype;
}

export interface MetadataQuery {
  hash: CID;
}
