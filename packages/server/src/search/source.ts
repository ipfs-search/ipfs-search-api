// Based on srcFields in query.ts
// TODO: Update based on mapping.

export interface Reference {
  // hash: string; This is somehow indexed in mapping but neither relevant or used
  name: string;
  parent_hash: string;
}

export interface Metadata {
  title?: string | string[];
  "dc:creator"?: string | string[];
  description?: string | string[];
  "Content-Type"?: string | string[];
  "dcterms:created"?: string | string[];
}

export interface Source {
  metadata?: Metadata;
  references?: Reference[];
  size?: number;
  "last-seen"?: string;
  "first-seen"?: string;
}
