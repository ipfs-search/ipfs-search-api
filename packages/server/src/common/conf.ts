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
  timeout: string;
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
  timeout: process.env["IPFS_SEARCH_API_TIMEOUT"] || "9s",
};

export default conf;
