import { DocType, DocSubtype } from "@ipfs-search/api-types";
import { strict as assert } from "node:assert";
import type { Client } from "@opensearch-project/opensearch";

// Aliases for OpenSearch indexes for subtypes.
export enum IndexAlias {
  Archives = "ipfs_archives",
  Audio = "ipfs_audio",
  Data = "ipfs_data",
  Directories = "ipfs_directories",
  Documents = "ipfs_documents",
  Images = "ipfs_images",
  Other = "ipfs_other",
  Unknown = "ipfs_unknown",
  Videos = "ipfs_videos",
}

// AliasResolver resolves index names to aliases and vice versa.
export class AliasResolver {
  client: Client;
  indexAliasMap = new Map<string, IndexAlias>();

  constructor(client: Client) {
    this.client = client;
  }

  private async refreshAliases(): Promise<void> {
    // Create comma-separated list of aliases from IndexAlias.
    const aliases: string[] = Object.values(IndexAlias).map((a) =>
      a.toString()
    );

    const { body: indexAliases } = await this.client.indices.getAlias({
      name: aliases,
    });

    // Map index names to aliases.
    for (const indexName in indexAliases) {
      const index = indexAliases[indexName];

      for (const alias in index.aliases) {
        assert(alias in IndexAlias);
        this.indexAliasMap.set(indexName, alias as IndexAlias);
      }
    }
  }

  // Get IndexAlias for a given index name.
  private indexToAlias(index: string): IndexAlias {
    // Refresh aliases when index is not found.
    if (!this.indexAliasMap.has(index)) {
      this.refreshAliases();
    }

    const alias = this.indexAliasMap.get(index);

    // Throw error when no alias is found after refresh.
    if (!alias) {
      throw new Error(`Unknown index: ${index}`);
    }

    return alias;
  }

  // Get the DocType for a given IndexAlias.
  private getDocType(i: IndexAlias): DocType {
    switch (i) {
      case IndexAlias.Directories:
        return DocType.Directory;
      case IndexAlias.Archives:
      case IndexAlias.Audio:
      case IndexAlias.Data:
      case IndexAlias.Documents:
      case IndexAlias.Images:
      case IndexAlias.Other:
      case IndexAlias.Unknown:
      case IndexAlias.Videos:
        return DocType.File;
      default:
        throw new Error(`Unknown index alias: ${i}`);
    }
  }

  // Get the DocSubtype for a given IndexAlias.
  private getDocSubtype(i: IndexAlias): DocSubtype {
    switch (i) {
      case IndexAlias.Archives:
        return DocSubtype.Archive;
      case IndexAlias.Audio:
        return DocSubtype.Audio;
      case IndexAlias.Data:
        return DocSubtype.Data;
      case IndexAlias.Documents:
        return DocSubtype.Document;
      case IndexAlias.Images:
        return DocSubtype.Image;
      case IndexAlias.Other:
        return DocSubtype.Other;
      case IndexAlias.Unknown:
        return DocSubtype.Unknown;
      case IndexAlias.Videos:
        return DocSubtype.Video;
      default:
        throw new Error(`Unknown index alias: ${i}`);
    }
  }

  // Get the DocType for a given index name.
  GetDocType(index: string): DocType {
    return this.getDocType(this.indexToAlias(index));
  }

  // Get the DocSubtype for a given index name.
  GetDocSubtype(index: string): DocSubtype {
    return this.getDocSubtype(this.indexToAlias(index));
  }

  // Get the IndexAlias for a given DocSubtype
  private getIndexAlias(subtype: DocSubtype): IndexAlias {
    switch (subtype) {
      case DocSubtype.Archive:
        return IndexAlias.Archives;
      case DocSubtype.Audio:
        return IndexAlias.Audio;
      case DocSubtype.Data:
        return IndexAlias.Data;
      case DocSubtype.Document:
        return IndexAlias.Documents;
      case DocSubtype.Image:
        return IndexAlias.Images;
      case DocSubtype.Other:
        return IndexAlias.Other;
      case DocSubtype.Unknown:
        return IndexAlias.Unknown;
      case DocSubtype.Video:
        return IndexAlias.Videos;
      default:
        throw new Error(`Unknown search result subtype: ${subtype}`);
    }
  }

  // Get the IndexAliases for a given DocType and DocSubtype.
  GetIndexAliases(type: DocType, subtype?: DocSubtype): IndexAlias[] {
    switch (type) {
      case DocType.Directory:
        return [IndexAlias.Directories];
      case DocType.File:
        if (subtype) {
          return [this.getIndexAlias(subtype)];
        } else {
          return [
            IndexAlias.Archives,
            IndexAlias.Audio,
            IndexAlias.Data,
            IndexAlias.Documents,
            IndexAlias.Images,
            IndexAlias.Other,
            IndexAlias.Unknown,
            IndexAlias.Videos,
          ];
        }
      default:
        throw new Error(`Unknown search result type: ${type}`);
    }
  }
}
