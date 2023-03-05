import {
  DocumentField,
  DocumentNestedField,
  MetadataField,
  FlatFieldName,
} from "./documentfields";

enum MetadataSourceField {
  Title = MetadataField.Title,
  Creator = MetadataField.Creator,
  Description = MetadataField.Descripton,
  ContentType = MetadataField.ContentType,
  Created = MetadataField.Created,
}

enum SourceField {
  References = DocumentNestedField.References,
  Size = DocumentField.Size,
  LastSeen = DocumentField.LastSeen,
  FirstSeen = DocumentField.FirstSeen,
}

export type Metadata = {
  [key in MetadataSourceField]: unknown;
};

export type Source =
  | {
      [key in SourceField]: unknown;
    }
  | {
      [DocumentNestedField.Metadata]: Metadata;
    };

const metadataFields = Object.values(MetadataSourceField);
const rootFields = Object.values(SourceField);

export const SourceFields: string[] = metadataFields
  .map((f) => FlatFieldName([DocumentNestedField.Metadata, f as MetadataField]))
  .concat(rootFields as string[]);
