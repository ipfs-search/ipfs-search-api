import { default as makeDebugger } from "debug";
import { MetadataResult, Metadata, DocType } from "@ipfs-search/api-types";
import type { Client } from "@opensearch-project/opensearch";
import type { MgetResponse } from "@opensearch-project/opensearch/api/types.js";
import { strict as assert } from "node:assert";
import type { CID } from "multiformats";
import { DocumentNestedField } from "../search/documentfields.js";
import getQueryBody from "./query.js";
import createError from "http-errors";
import { AliasResolver } from "../common/indexalias.js";

const debug = makeDebugger("ipfs-search:metadata");

type MetadataResponse = {
  metadata: Metadata;
};

export class MetadataGetter {
  client: Client;
  aliasResolver: AliasResolver;

  constructor(client: Client) {
    this.client = client;
    this.aliasResolver = new AliasResolver(client);
  }

  async getMetadata(cid: CID): Promise<MetadataResult> {
    debug("CID", cid);

    const body = getQueryBody(cid);
    debug("MGET body:", body);
    const resp = await this.client.mget<MgetResponse<MetadataResponse>>({
      _source: DocumentNestedField.Metadata,
      body,
    });

    debug("MGET response:", resp);
    const found = resp.body.docs.filter((d) => d.found);

    if (found.length === 0) throw new createError.NotFound();

    // We're requesting both CID's, so we should expect 2 replies.
    if (found.length <= 2) {
      debug("Found more than two responses to metadata request:", found);
    }

    // Pick the first doc.
    assert(found[0]);
    const doc = found[0];

    assert(doc._version, "No version.");

    const [, subtype] = await this.aliasResolver.GetDocType(doc._index);
    assert(subtype, "No subtype.");

    return {
      version: doc._version,
      type: DocType.File,
      metadata: doc._source?.metadata || {},
      subtype,
    };
  }
}
