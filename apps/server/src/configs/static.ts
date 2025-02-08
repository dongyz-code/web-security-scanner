import { join } from 'node:path';
import { fse } from '@m170/utils/node';
import { PROCESS_ENV } from './env.js';
import { SERVER_DIR } from './static-conf.js';

export const LOCAL_REMOTE_IP = '192.168.1.32';

/** ---------------  基础配置  ------------------ */

/** 服务端口 */
export const PORT = 7777;
/** jwt cecret */
export const JWT_SECRET = 'medomino';
/** token 过期时间 */
export const TOKEN_EXPIRESIN = '24h';
/** redis 服务的 host */
export const REDIS_HOST = '';
/** redis 服务的 post */
export const REDIS_PORT = 6379;

/** ---------------  路径配置  ------------------ */
/** server 目录 */
export const PROJECT_DIR = join(SERVER_DIR, '../');
/** 静态资源文件，提前给到的 */
export const STATIC_DATA_DIR = join(SERVER_DIR, 'static-data');
/** 项目运行产生的所有文件 */
export const FILES_DIR = join(SERVER_DIR, 'static');
/** 日志文件路径 */
export const LOG_DIR = join(FILES_DIR, 'logs');
/** 临时文件路径 */
export const TEMO_DIR = join(FILES_DIR, 'temp');
/** 数据更新路径, 每次更新，选取一个最新的版本，更新后重置版本 */
export const DATA_UPDATE_DIR = join(FILES_DIR, 'data-update');
export const DATA_UPDATE_TEMP_DIR = join(FILES_DIR, 'data-update-demp');

/** 数据更新路径，视情况保留版本 */
export const DATA_UPDATE_DIR_V2 = join(FILES_DIR, 'data-update-v2');

/** MOCK 数据,  */
export const MOCK_DIR_PRE = join(FILES_DIR, 'mock');
export const MOCK_DIR_RESULT = join(STATIC_DATA_DIR, 'mock');

fse.ensureDirSync(DATA_UPDATE_DIR);
fse.ensureDirSync(DATA_UPDATE_DIR_V2);
fse.ensureDirSync(DATA_UPDATE_TEMP_DIR);

/** 允许跨域的地址列表 */
export const CORS_LIST = [
  /** ------------------- */
  'http://localhost:9000',
];
