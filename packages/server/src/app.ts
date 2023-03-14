import conf from "./common/conf.js";
import Fastify, { FastifyInstance, FastifyLoggerOptions } from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger.js";
import { Searcher } from "./search/search.js";
import type { Client } from "@opensearch-project/opensearch";
import {
  DocSubtype,
  DocType,
  SearchQuery,
  SearchQueryType,
} from "@ipfs-search/api-types";

// From Fastify type.
type Logger = FastifyLoggerOptions | PinoLoggerOptions | boolean;

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

function getSearchQueryTypes(): SearchQueryType[] {
  const t: SearchQueryType[] = Object.values(DocType);
  return t.concat("any");
}

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
              type: "string",
              maxLength: 1684,
            },
            page: {
              type: "integer",
              default: 0,
              minimum: 0,
              maximum: conf.maxPage,
            },
            type: {
              type: "string",
              default: "any",
              enum: getSearchQueryTypes(),
            },
            subtypes: {
              type: "array",
              uniqueItems: true,
              maxItems: Object.keys(DocSubtype).length,
              items: {
                type: "string",
                enum: Object.values(DocSubtype),
              },
            },
          },
        },
      },
    },
    async (request) => {
      const { page, type, subtypes } = request.query;
      const query: SearchQuery = {
        query: request.query.q,
        page,
        type,
        subtypes: subtypes ? subtypes : [],
      };

      // TODO: Test whether 429's are propagated.
      return searcher.search(query);
    }
  );

  return app;
}
