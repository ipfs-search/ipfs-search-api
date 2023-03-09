import type { DocType, DocSubtype } from "./doctypes.js";

export type SearchQueryType = DocType | "any";

export interface SearchQuery {
  query: string;
  type: SearchQueryType;
  subtype?: DocSubtype;
  page: number;
}
