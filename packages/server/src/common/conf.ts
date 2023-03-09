import process from "process";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

type Configuration = {
  openSearchURL: string;
  environment: Environment;
};

const conf: Configuration = {
  openSearchURL: process.env["OPENSEARCH_URL"] || "http://localhost:9200",
  environment:
    (process.env["NODE_ENV"] as Environment) || Environment.Development,
};

export default conf;
