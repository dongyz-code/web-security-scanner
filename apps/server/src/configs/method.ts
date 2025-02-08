/** 常用方法 */
import { fork } from "node:child_process";
import { join, parse } from "node:path";
import { readdirSync } from "node:fs";
import { logger } from "./logs.js";
import { DATA_UPDATE_DIR } from "./static.js";

import type { Simplify } from "@m170/types";
import type { ChildProcess, Serializable } from "child_process";
import type { MODEL_SQL_DATA } from "../types/index.js";

/** 毫秒数转换为可读性的值 */
export function handleTime(n: number) {
  let prefix = "";
  if (n < 0) {
    prefix = "-";
    n = Math.abs(n);
  }

  const _s = n / 1000;
  const h = Math.floor(_s / 3600);
  const m = Math.floor((_s - h * 3600) / 60);
  const s = (_s - h * 3600 - m * 60).toFixed(1);
  let str = "";
  if (h) {
    str += `${h}h`;
  }
  if (m) {
    str += `${m}m`;
  }
  if (s) {
    str += `${s}s`;
  }
  return prefix + str;
}

/** map, 选取值 */
export function pickObj<T extends Record<string, unknown>, K extends keyof T>(
  data: T[],
  keys?: K[],
) {
  if (!keys?.length) {
    return data;
  }
  const main = data.map((e) => {
    const obj = {} as Simplify<{
      [key in K]: T[key];
    }>;
    keys.forEach((key) => {
      if (key in e) {
        obj[key] = e[key];
      }
    });
    return obj;
  });
  return main;
}

export { getFilterQuery, getUpdateSql } from "@m170/logics/tables-pgsql";

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
    worker = fork(script, ["--max-old-space-size=16000", ...args]);
    worker.on("spawn", () => {
      logger.log(`${label} spawn`.toUpperCase());
    });
    worker.on("error", (error) => {
      logger.error(`${label} error: ${error.message}`);
      logger.error(error);
    });
    worker.on("close", (code, signal) => {
      logger.info(`${label} close, will restart: `);
      logger.log({
        code,
        signal,
      });
      /** 退出重启 */
      worker = fork(script, ["--max-old-space-size=16000", ...args]);
    });
    process.on("exit", () => {
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

/** 获取数据更新存储位置 */
export function getUpdateDirs(_version?: string) {
  const version = _version ?? Date.now() + "";
  const rootDir = join(DATA_UPDATE_DIR, version);

  const targetDir = join(rootDir, "target");
  const targetFiles = (key: keyof MODEL_SQL_DATA) =>
    join(targetDir, `${key}.json`);

  return {
    /** 数据版本 */
    version,
    rootDir,
    /** 预处理后，写入的JSON文件，之后可以导入数据库/ES */
    targetDir,
    /** 目标文件 */
    targetFiles,
  };
}

/** 不要改！ */
const rootSplit = "###";

/** 标签处理 */
export function getEsTagVal({ type, value }: { type: string; value: string }) {
  return `${type}###${value}`;
}

/** BRAND_ID + AKUE? + VAL */
export function getAkueRace(...items: string[]) {
  return items.join(rootSplit);
}

/** APIWrap, data 包裹，避免重复序列化 */
export function apiRespDataWrap(data: unknown) {
  if (typeof data === "string") {
    return data;
  }
  return JSON.stringify({
    data,
  });
}
