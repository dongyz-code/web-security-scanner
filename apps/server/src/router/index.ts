import { authentication } from './utils/index.js';
import {
  GetAPIByDir,
  fastifyHooks,
  getRespErrorCodeMsg,
  errorSymbol,
  uuid,
} from '../configs/index.js';
import path, { join } from 'path';
import { getAPIBySingleFile } from '@m170/fastify';
import { fse, getDirname } from '@m170/utils/node';

import type { API } from '../types/index.js';

const __dirname = getDirname(import.meta.url);

export const routes: GetAPIByDir<API['prefix']> = {
  prefix: '/api',
  dir: join(__dirname, 'routes'),
  log: false,
};

export const getRoutes = async () => {
  const dir = path.join(__dirname, 'routes-one');
  const file = (await fse.readdir(dir)).find((x) => x.startsWith('index.'));
  if (!file) {
    return [];
  }
  return await getAPIBySingleFile({
    file: join(dir, file),
    prefix: '/api',
  });
};

export const callback: typeof fastifyHooks.preSerialization = (fastify) => {
  /**
   * Notice: the done callback is not available when using async/await or returning a Promise
   *
   * async/await  or done; you can choose one
   *
   * reply.send 会触发 preSerialization，所以提前返回的错误信息就 done(err)
   *
   */
  /** 进行路由函数前处理 */
  fastify.addHook('preParsing', (req, reply, payload, done) => {
    done(authentication(req));
  });

  /** 对响应实体进行处理 */
  fastify.addHook('preSerialization', (req, reply, payload: any, done) => {
    // console.log("preSerialization");
    if (errorSymbol in payload) {
      // reply.status(500);
      done(null, { error: payload[errorSymbol] });
    } else {
      done(null, { data: payload });
    }
  });
  /** 错误处理 */
  fastify.setErrorHandler(function (error, request, reply) {
    this.log.error(error);
    console.error(error);
    reply.send(getRespErrorCodeMsg(error.message));
  });
};
