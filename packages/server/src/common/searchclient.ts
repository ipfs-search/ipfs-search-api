import { Client } from "@opensearch-project/opensearch";
import conf from "./conf";

export function getClient(): Client {
  return new Client({
    node: conf.openSearchURL,
    maxRetries: 0,
    requestTimeout: 5000,
    // sniffOnStart: false,
    // sniffInterval: 30000,
    // sniffOnConnectionFault: true,
  });
}
