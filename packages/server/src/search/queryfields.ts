import { flatten } from "flat";

import {
  DocumentField,
  LinksField,
  MetadataField,
  ReferenceField,
  DocumentNestedField,
} from "./documentfields";

type nestedMapping = {
  [DocumentNestedField.Links]: { [key in LinksField]?: number };
  [DocumentNestedField.Metadata]: { [key in MetadataField]?: number };
  [DocumentNestedField.References]: { [key in ReferenceField]?: number };
};

type boostMapping =
  | {
      [key in DocumentField]?: number;
    }
  | nestedMapping;

const queryFieldBoostMapping: boostMapping = {
  // "_id^10",
  [DocumentField.CID]: 10,
  [DocumentField.Content]: 1,
  // urls: 1,
  links: {
    [LinksField.Name]: 3,
    [LinksField.Hash]: 3,
  },
  metadata: {
    [MetadataField.Identifier]: 10,
    [MetadataField.Title]: 8,
    [MetadataField.Creator]: 8,
    // subject: 5,
    // "xmpDM:album": 5,
    // "xmpDM:compilation": 4,
    [MetadataField.Descripton]: 3,
    [MetadataField.ContentType]: 2,
  },
  references: {
    [ReferenceField.Name]: 8,
    [ReferenceField.ParentHash]: 3,
  },
};

export const QueryFields: Record<string, number> = flatten(
  queryFieldBoostMapping
);
