import { join } from 'node:path';
import { SERVER_DIR } from './static-conf.js';

export const LOCAL_REMOTE_IP = '192.168.1.32';

/** ---------------  基础配置  ------------------ */

/** 服务端口 */
export const PORT = 7777;
/** jwt cecret */
export const JWT_SECRET = 'medomino';
/** token 过期时间 */
export const TOKEN_EXPIRESIN = '24h';

/** ---------------  路径配置  ------------------ */
/** server 目录 */
export const PROJECT_DIR = join(SERVER_DIR, '../');
/** 静态资源文件，提前给到的 */
export const STATIC_DATA_DIR = join(SERVER_DIR, 'static-data');
/** 项目运行产生的所有文件 */
export const FILES_DIR = join(SERVER_DIR, 'static');
/** 日志文件路径 */
export const LOG_DIR = join(FILES_DIR, 'logs');
/** 报告文件路径 */
export const REPORT_DIR = join(FILES_DIR, 'report');
/** 临时文件路径 */
export const TEMP_DIR = join(FILES_DIR, 'temp');

/** 允许跨域的地址列表 */
export const CORS_LIST = [
  /** ------------------- */
  'http://localhost:9000',
];
