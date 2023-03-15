import type { CID } from "multiformats";
import { FileIndexes } from "../common/indexalias.js";
import crypto from "node:crypto";

type mgetDoc = {
  _index: string;
  _id: string;
};

type mgetBody = {
  docs: mgetDoc[];
};

function cidToDocID(i: string): string {
  const url = `ipfs://${i}`;
  const shasum = crypto.createHash("sha1").update(url).digest("base64");

  return shasum.replace(/={1,2}$/, ""); // Remove padding.
}

export default function getQueryBody(cid: CID): mgetBody {
  // Use both V0 and V1 CID's.
  const cids = [cid.toV0().toString(), cid.toV1().toString()];

  const docIds = cids.map(cidToDocID);

  const docs: mgetDoc[] = Array(docIds.length * FileIndexes.length);
  let i = 0;
  for (const docId of docIds) {
    for (const index of FileIndexes) {
      docs[i] = { _index: index, _id: docId };
      i++;
    }
  }

  return {
    docs,
  };
}
