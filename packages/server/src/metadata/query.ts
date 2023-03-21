import { default as makeDebugger } from "debug";
import type { CID } from "multiformats";
import { FileIndexes } from "../common/indexalias.js";
import crypto from "node:crypto";
const debug = makeDebugger("ipfs-search:metadata:query");

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
  const cids = [cid.toV1().toString()];

  // We can't always go from CIDv1 back to
  try {
    cids.push(cid.toV0().toString());
  } catch (e) {
    if (
      // Ignore it if we can't make us CIDv0.
      e instanceof Error &&
      e.message.includes("Cannot convert") &&
      e.message.includes("CID to CIDv0")
    ) {
      debug(e);
    } else {
      throw e;
    }
  }

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
