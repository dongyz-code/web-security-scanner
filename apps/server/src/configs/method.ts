/** 常用方法 */
import { fork } from 'node:child_process';
import { join, parse } from 'node:path';
import { readdirSync } from 'node:fs';
import { logger } from './logs.js';

import type { ChildProcess, Serializable } from 'child_process';

export { getFilterQuery, getUpdateSql } from '@m170/logics/tables-pgsql';

/** 获取子进程真实脚本位置 */
function getRealScript(script: string) {
  const { dir, name } = parse(script);
  const files = readdirSync(dir);
  const file = files.find((x) => parse(x).name === name);
  if (file) {
    script = join(dir, file);
  }
  return script;
}

/** 初始化 fork 子进程 */
export function initForkWorker<Task extends Serializable>({
  script,
  args = [],
  label,
}: {
  script: string;
  label: string;
  args?: string[];
}) {
  let worker: ChildProcess | null = null;

  script = getRealScript(script);

  const install = () => {
    worker = fork(script, ['--max-old-space-size=16000', ...args]);
    worker.on('spawn', () => {
      logger.log(`${label} spawn`.toUpperCase());
    });
    worker.on('error', (error) => {
      logger.error(`${label} error: ${error.message}`);
      logger.error(error);
    });
    worker.on('close', (code, signal) => {
      logger.info(`${label} close, will restart: `);
      logger.log({
        code,
        signal,
      });
      /** 退出重启 */
      worker = fork(script, ['--max-old-space-size=16000', ...args]);
    });
    process.on('exit', () => {
      logger.log(`main process exited, kill ${label}`);
      worker?.kill(1);
    });
  };

  const addTask = (item: Task) => {
    if (!worker) {
      logger.error(`${label}, worker is not ready`);
    }
    worker?.send(item);
  };

  return {
    install,
    addTask,
  };
}

/** APIWrap, data 包裹，避免重复序列化 */
export function apiRespDataWrap(data: unknown) {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify({
    data,
  });
}
