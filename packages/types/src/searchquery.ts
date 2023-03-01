import type { SearchResultType } from "./searchresult";

export enum AnyType {
  Any = "any",
}

export type SearchQueryType = SearchResultType | AnyType;

export interface SearchQuery {
  query: string;
  type?: SearchQueryType;
  page?: number;
}
