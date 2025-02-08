import { LOG_DIR } from "./static.js";
import { IS_DOCKER } from "./env.js";
import { initPinoLogger } from "@m170/logics/pino";

export const { logger, fastifyLogger } = initPinoLogger({
  logDir: LOG_DIR,
  devPretty: !IS_DOCKER,
});
