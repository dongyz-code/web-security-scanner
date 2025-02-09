import {
  creatFastify,
  fastifyLogger,
  CORS_LIST,
  logger,
  PORT,
  ROOT_SCHEDULE,
  ROOT_CONF,
} from './configs/index.js';
import { getRoutes, callback } from './router/index.js';
import { tableHealthCheck } from './database/index.js';
import { IS_AWS, IS_DOCKER } from './configs/index.js';

console.info('CONF:', {
  IS_AWS,
  IS_DOCKER,
  MEDO_ENV: ROOT_CONF.MEDO_ENV,
});

async function createServer() {
  console.log('TableHealthCheck:', await tableHealthCheck());

  await creatFastify({
    fastify: {
      options: {
        loggerInstance: fastifyLogger,
        trustProxy: true,
        /** 1G */
        bodyLimit: 1e6 * 1e3,
      },
      cors: {
        origin: IS_DOCKER ? CORS_LIST : true,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      },
      routes: await getRoutes(),
      callback,
    },
    configs: {
      listen: PORT,
      callback({ listen }) {
        logger.info(`SERVER: http://localhost:${listen}/`);
      },
    },
  });

  ROOT_SCHEDULE.install();
}

createServer();

process.on('uncaughtException', logger.error);
process.on('unhandledRejection', logger.error);
process.on('uncaughtExceptionMonitor', logger.error);
