import process from "process";

const conf = {
  openSearchURL: process.env["OPENSEARCH_URL"] || "http://localhost:9200",
};

export default conf;
