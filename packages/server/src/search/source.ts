import {
  DocumentField,
  DocumentNestedField,
  MetadataField,
  FlatFieldName,
  ReferenceField,
} from "./documentfields.js";

import type {
  TupleToUnion,
  Extends,
  Writeable,
  FieldsToObject,
} from "../common/typehelpers.js";

const metadataFields = [
  MetadataField.Title,
  MetadataField.Creator,
  MetadataField.Descripton,
  MetadataField.ContentType,
  MetadataField.Created,
] as const; // Const ensures that the type is narrow, limiting fields in FieldsToType below.

const referenceFields = [
  ReferenceField.Name,
  ReferenceField.ParentHash,
] as const;

const rootFields = [
  DocumentField.CID,
  DocumentField.Size,
  DocumentField.LastSeen,
  DocumentField.FirstSeen,
] as const;

type srcMetadata = TupleToUnion<
  Extends<Writeable<typeof metadataFields>, MetadataField[]>
>;

type srcReferences = TupleToUnion<
  Extends<Writeable<typeof referenceFields>, ReferenceField[]>
>;

type src = TupleToUnion<Extends<Writeable<typeof rootFields>, DocumentField[]>>;

export type BaseValue = string | number;
export type SourceValue = BaseValue | BaseValue[];
export type Reference = FieldsToObject<srcReferences, string>;
export type Metadata = FieldsToObject<srcMetadata, SourceValue>;
export type Source =
  | FieldsToObject<src, SourceValue> & {
      references: Reference[];
      metadata?: Metadata;
    };

// Construct single array with flattened field names for query.
export const SourceFields: string[] = [
  metadataFields.map((f) => FlatFieldName([DocumentNestedField.Metadata, f])),
  referenceFields.map((f) =>
    FlatFieldName([DocumentNestedField.References, f])
  ),
  rootFields,
].flat();
