import type { CID } from "multiformats/cid";
import type { SearchResultType, SearchResultSubType } from "./searchresult";

export interface MetadataResult {
  metadata: object;
  version: number;
  type: SearchResultType.File;
  subtype: SearchResultSubType;
}

export interface MetadataQuery {
  hash: CID;
}
