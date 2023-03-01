import { SearchResultType, SearchResultSubType } from "@ipfs-search/api-types";

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

// Get the SearchResultType for a given IndexAlias.
export function getResultType(i: IndexAlias): SearchResultType {
  switch (i) {
    case IndexAlias.Directories:
      return SearchResultType.Directory;
    case IndexAlias.Archives:
    case IndexAlias.Audio:
    case IndexAlias.Data:
    case IndexAlias.Documents:
    case IndexAlias.Images:
    case IndexAlias.Other:
    case IndexAlias.Unknown:
    case IndexAlias.Videos:
      return SearchResultType.File;
    default:
      throw new Error(`Unknown index alias: ${i}`);
  }
}

// Get the SearchResultSubType for a given IndexAlias.
export function getResultSubType(i: IndexAlias): SearchResultSubType {
  switch (i) {
    case IndexAlias.Archives:
      return SearchResultSubType.Archive;
    case IndexAlias.Audio:
      return SearchResultSubType.Audio;
    case IndexAlias.Data:
      return SearchResultSubType.Data;
    case IndexAlias.Documents:
      return SearchResultSubType.Document;
    case IndexAlias.Images:
      return SearchResultSubType.Image;
    case IndexAlias.Other:
      return SearchResultSubType.Other;
    case IndexAlias.Unknown:
      return SearchResultSubType.Unknown;
    case IndexAlias.Videos:
      return SearchResultSubType.Video;
    default:
      throw new Error(`Unknown index alias: ${i}`);
  }
}

// Get the IndexAlias for a given SearchResultSubType.
export function getIndexAlias(subtype: SearchResultSubType): IndexAlias {
  switch (subtype) {
    case SearchResultSubType.Archive:
      return IndexAlias.Archives;
    case SearchResultSubType.Audio:
      return IndexAlias.Audio;
    case SearchResultSubType.Data:
      return IndexAlias.Data;
    case SearchResultSubType.Document:
      return IndexAlias.Documents;
    case SearchResultSubType.Image:
      return IndexAlias.Images;
    case SearchResultSubType.Other:
      return IndexAlias.Other;
    case SearchResultSubType.Unknown:
      return IndexAlias.Unknown;
    case SearchResultSubType.Video:
      return IndexAlias.Videos;
    default:
      throw new Error(`Unknown search result subtype: ${subtype}`);
  }
}

// Get the IndexAliases for a given SearchResultType and SearchResultSubType.
export function getIndexAliases(type: SearchResultType, subtype?: SearchResultSubType): []IndexAlias {
  switch (type) {
    case SearchResultType.Directory:
      return [IndexAlias.Directories];
    case SearchResultType.File:
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
