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
import { CID } from "multiformats";
import createError from "http-errors";
import { MetadataGetter } from "./metadata/metadata.js";
import { fastifyEtag } from "@fastify/etag";

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

type SearchQuerystring = Omit<SearchQuery, "query"> & { q: string };
type MetadataParams = { hash: string };

function getSearchQueryTypes(): SearchQueryType[] {
  const t: SearchQueryType[] = Object.values(DocType);
  return t.concat("any");
}

export default function App(client: Client) {
  const app: FastifyInstance = Fastify({
    logger: envToLogger[conf.environment] ?? true,
  });

  app.register(fastifyEtag);

  const searcher = new Searcher(client),
    metadatagetter = new MetadataGetter(client);

  app.get<{ Params: MetadataParams }>(
    "/metadata/:hash/",
    {
      schema: {
        params: {
          hash: {
            type: "string",
            minLength: 5,
            maxLength: 120,
          },
        },
      },
    },
    async (request) => {
      const { hash } = request.params;
      let cid: CID;

      // DIY validation
      try {
        cid = CID.parse(hash);
      } catch (e) {
        throw new createError.BadRequest();
      }

      return metadatagetter.getMetadata(cid);
    }
  );

  app.get<{ Querystring: SearchQuerystring }>(
    "/search",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: {
              type: "string",
              maxLength: 1684,
              // Validate maximum number of words
              pattern: `^(\\S+\\s+){0,${conf.maxTerms}}\\S+$`,
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

      // Abort logic
      const controller = new AbortController();
      request.raw.on("close", () => {
        if (request.raw.aborted) {
          controller.abort();
          app.log.info("request aborted");
        }
      });

      return searcher.search(query, controller.signal);
    }
  );

  return app;
}
