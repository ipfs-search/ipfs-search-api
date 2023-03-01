import { DocType, DocSubtype } from "@ipfs-search/api-types";

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

// Get the DocType for a given IndexAlias.
export function getResultType(i: IndexAlias): DocType {
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
export function getResultSubType(i: IndexAlias): DocSubtype {
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

// Get the IndexAlias for a given DocSubtype
export function getIndexAlias(subtype: DocSubtype): IndexAlias {
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
export function getIndexAliases(
  type: DocType,
  subtype?: DocSubtype
): IndexAlias[] {
  switch (type) {
    case DocType.Directory:
      return [IndexAlias.Directories];
    case DocType.File:
      if (subtype) {
        return [getIndexAlias(subtype)];
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
