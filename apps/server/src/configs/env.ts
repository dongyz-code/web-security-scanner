import { config } from 'dotenv';
import { join } from 'node:path';
import { getDirname } from '@m170/utils/node';

import type { Env, ROOTENV } from '@/types/index.js';

config({
  path: join(getDirname(import.meta.url), '../../.env'),
});

/** 所有相关的环境变量 */
export const PROCESS_ENV = process.env as ROOTENV;

const MEDO_ENV_CONF = PROCESS_ENV['MEDO_ENV_CONF'] ?? '00';

/** 是否是 AWS 环境 */
export const IS_AWS = MEDO_ENV_CONF[0] === '1';
/** 是否是 docker 环境 */
export const IS_DOCKER = MEDO_ENV_CONF[1] === '1';
