import { Client } from "@opensearch-project/opensearch";
import App from "./app.js";
import conf from "./common/conf.js";

const start = async () => {
  const client = new Client({
    node: conf.openSearchURL,
    maxRetries: 0, // Retries should be handled by load balancer.
  });
  const app = App(client);

  try {
    await app.listen(conf.apiPort, conf.apiHost);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
