import process from "process";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

export type Configuration = {
  apiHost: string;
  apiPort: number;
  openSearchURL: string;
  environment: Environment;
  pageSize: number;
  maxPage: number;
  shardTimeout: string;
  requestTimeout: number;
  maxTerms: number;
};

function intFromEnv(k: string): number | undefined {
  const val = process.env[k];
  if (val) return parseInt(val);
  return;
}

const conf: Configuration = {
  apiHost: process.env["IPFS_SEARCH_API_HOST"] || "localhost",
  apiPort: intFromEnv("IPFS_SEARCH_API_PORT") || 9615,
  openSearchURL: process.env["OPENSEARCH_URL"] || "http://localhost:9200",
  environment:
    (process.env["NODE_ENV"] as Environment) || Environment.Development,
  pageSize: intFromEnv("PAGE_SIZE") || 15,
  maxPage: intFromEnv("MAX_PAGE") || 50,
  shardTimeout: process.env["IPFS_SEARCH_API_SHARD_TIMEOUT"] || "9s", // After 9s, just return whatever we have.
  requestTimeout: intFromEnv("IPFS_SEARCH_API_REQUEST_TIMEOUT") || 10000, // 10s
  maxTerms: intFromEnv("IPFS_SEARCH_API_MAX_TERMS") || 100,
};

export default conf;
