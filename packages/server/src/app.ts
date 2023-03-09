import conf from "./common/conf.js";
import Fastify, {
  FastifyInstance,
  FastifyLoggerOptions,
  RouteShorthandOptions,
} from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger.js";
import type { Server } from "http";

type logger = boolean | (FastifyLoggerOptions<Server> & PinoLoggerOptions);
const envToLogger: Record<string, logger> = {
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

const app: FastifyInstance = Fastify({
  logger: envToLogger[conf.environment] ?? true,
});

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          pong: {
            type: "string",
          },
        },
      },
    },
  },
};

// app.get("/ping", opts, async (request, reply) => {
//   return { pong: "it worked!" };
// });

app.get("/ping", opts, async () => {
  return { pong: "it worked!" };
});

export default app;
