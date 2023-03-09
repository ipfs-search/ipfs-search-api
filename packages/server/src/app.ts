import conf from "./common/conf.js";
import Fastify, { FastifyInstance, FastifyLoggerOptions } from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger.js";
import type { Server } from "http";
import { Searcher } from "./search/search.js";
import type { Client } from "@opensearch-project/opensearch";
import type { SearchQuery } from "@ipfs-search/api-types";

// From Fastify type.
type Logger = boolean | (FastifyLoggerOptions<Server> & PinoLoggerOptions);

const envToLogger: Record<string, Logger> = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

type Querystring = Omit<SearchQuery, "query"> & { q: string };

export default function App(client: Client) {
  const app: FastifyInstance = Fastify({
    logger: envToLogger[conf.environment] ?? true,
  });
  const searcher = new Searcher(client);

  app.get<{ Querystring: Querystring }>(
    "/search",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: {
              // TODO: Validate max length and possibly max terms.
              type: "string",
            },
            page: {
              // TODO: Validate >0 and <maxPage
              type: "integer",
              default: 0,
            },
            type: {
              // TODO: Use enum
              type: "string",
              default: "any",
            },
            subtype: {
              // TODO: Use enum
              type: "string",
            },
          },
        },
      },
    },
    async (request) => {
      const { page, type, subtype } = request.query;
      const query: SearchQuery = {
        query: request.query.q,
        page,
        type,
      };

      if (subtype) {
        query.subtype = subtype;
      }

      return searcher.search(query);
    }
  );

  return app;
}
