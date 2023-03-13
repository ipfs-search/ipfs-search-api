import process from "process";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

export type Configuration = {
  openSearchURL: string;
  environment: Environment;
  pageSize: number;
  maxPage: number;
};

function intFromEnv(k: string): number | undefined {
  const val = process.env[k];
  if (val) return parseInt(val);
  return;
}

const conf: Configuration = {
  openSearchURL: process.env["OPENSEARCH_URL"] || "http://localhost:9200",
  environment:
    (process.env["NODE_ENV"] as Environment) || Environment.Development,
  pageSize: intFromEnv("PAGE_SIZE") || 15,
  maxPage: intFromEnv("MAX_PAGE") || 50,
};

export default conf;
