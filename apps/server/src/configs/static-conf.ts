import { ROOT_ERROR } from './errors.js';
import { fse, sha256, getDirname } from '@m170/utils/node';
import { join } from 'node:path';

import type { CONF, Env, TokenData } from '../types/index.js';
import { PROCESS_ENV } from './env.js';

const __dirname = getDirname(import.meta.url);

/** 项目根路径 */
export const SERVER_DIR = join(__dirname, '../../');

/** 项目配置文件路径 */
export const CONF_FILE = join(SERVER_DIR, '.conf/conf.json');

export function getEncryptedPassword(user_id: string, password: string) {
  return sha256(`${user_id}${password}`);
}

/** --------------- ROOT PG MAIL ADMIN账户 配置  ------------------ */
export const ROOT_CONF = (() => {
  try {
    if (!fse.pathExistsSync(CONF_FILE)) {
      throw new Error(ROOT_ERROR['系统配置: 配置文件不存在']);
    }
    const conf: CONF = fse.readJSONSync(CONF_FILE);
    if (!conf.pg) {
      throw new Error(ROOT_ERROR['系统配置: PG 配置不存在']);
    }

    const defaultConf: typeof conf.administrator = {
      user_id: 'medomino',
      password: 'medomino',
      nickname: '系统管理员',
      mail: '',
    };
    const { user_id, password, ...rest } = Object.assign(defaultConf, conf.administrator || {});
    conf.administrator = {
      user_id,
      password: getEncryptedPassword(user_id, password),
      ...rest,
    };
    return conf;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

export function isAdmin({ user_id, password }: { user_id: string; password: string }) {
  return (
    user_id === ROOT_CONF.administrator.user_id && password === ROOT_CONF.administrator.password
  );
}

export function isAdminWithoutVerify({ user_id, method }: Pick<TokenData, 'user_id' | 'method'>) {
  return user_id === ROOT_CONF.administrator.user_id && method === 'PASSWORD';
}

/** MEDO_ENV 环境 */
export const MEDO_ENV: Env = PROCESS_ENV['MEDO_ENV'] ?? ROOT_CONF['MEDO_ENV'] ?? 'default';

if (MEDO_ENV.match(/[^\w]/)) {
  throw new Error('env is not valid!');
}
