import { getKeys } from '@m170/utils/node';
import { logger } from './configs/logs.js';

async function getServerConf() {
  const { tableInit, tables } = await import('./database/index.js');
  await tableInit({ list: getKeys(tables) });
  await import('./server.js');
}

getServerConf().catch((error) => {
  logger.error(error);
  process.exit(1);
});
