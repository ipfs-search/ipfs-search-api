// Specification of Document.

export enum ReferenceField {
  // hash: string; This is somehow indexed in mapping but neither relevant or used
  Name = "name",
  ParentHash = "parent_hash",
}

export enum LinksField {
  Name = "Name",
  Hash = "Hash",
}

export enum MetadataField {
  Title = "title",
  Creator = "dc:creator",
  Identifier = "dc:Identifier",
  Descripton = "description",
  ContentType = "Content-Type",
  Created = "dcterms:created",
}

export enum DocumentField {
  CID = "cid",
  URLs = "urls",
  Size = "size",
  Content = "content",
  LastSeen = "last-seen",
  FirstSeen = "first-seen",
}

export enum DocumentNestedField {
  Metadata = "metadata",
  References = "references",
  Links = "links",
}
