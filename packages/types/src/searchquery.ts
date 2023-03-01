import type { DocType, DocSubtype } from "./doctypes";

export type SearchQueryType = DocType | "any";

export interface SearchQuery {
  query: string;
  type: DocType;
  subtype?: DocSubtype;
  page: number;
}
