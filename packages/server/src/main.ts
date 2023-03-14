import { Client } from "@opensearch-project/opensearch";
import App from "./app.js";

const start = async () => {
  const client = new Client({
    node: "http://localhost:9200", // TODO: Make configurable.
    maxRetries: 0, // Retries should be handled by load balancer.
  });
  const app = App(client);

  try {
    await app.listen({ port: 9615 }); // TODO: Port and address configurable.
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
