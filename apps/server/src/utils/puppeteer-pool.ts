/** 文件弃用 */

import puppeteer, { LaunchOptions } from 'puppeteer';
import genericPool from 'generic-pool';

export type PuppeteerPoolOptions = {
  /** 保证池中最多有多少个实例存活 默认 15 */
  max?: number;
  /** 保证池中最少有多少个实例存活 默认 1 */
  min?: number;
  /** 在将实例提供给用户之前，池应该验证这些实例 默认 true */
  testOnBorrow?: boolean;
  /** 是否在池初始化时初始化实例 默认 false */
  autostart?: boolean;
  /** 如果一个实例 n毫秒 都没访问就关掉他 默认 60min */
  idleTimeoutMillis?: number;
  /** 定时检查实例的访问状态 默认 3min */
  evictionRunIntervalMillis?: number;
  /** puppeteer.launch 启动的参数 */
  puppeteerArgs?: puppeteer.LaunchOptions;
  /** 用户自定义校验 参数是 取到的一个实例 */
  validator?: (instance: puppeteer.Browser) => Promise<boolean>;
};

/**
 * 无头浏览器池，避免每一次请求都去产生一个 puppeteer 实例
 */
export class PuppeteerPool {
  private option: PuppeteerPoolOptions;
  private pool: genericPool.Pool<puppeteer.Browser>;
  constructor(option: PuppeteerPoolOptions) {
    this.option = option;
    this.pool = this.createPool();
  }

  private createPool() {
    const {
      max = 15,
      min = 1,
      testOnBorrow = true,
      autostart = false,
      idleTimeoutMillis = 3600000,
      evictionRunIntervalMillis = 180000,
      puppeteerArgs,
      validator,
    } = this.option;

    const factory: genericPool.Factory<puppeteer.Browser> = {
      async create() {
        const instance = puppeteer.launch(puppeteerArgs);
        return instance;
      },
      async destroy(instance) {
        return instance.close();
      },
      async validate(instance) {
        return validator?.(instance) ?? true;
      },
    };

    const config: genericPool.Options = {
      max,
      min,
      testOnBorrow,
      autostart,
      idleTimeoutMillis,
      evictionRunIntervalMillis,
    };

    return genericPool.createPool(factory, config);
  }

  /** 获取一个实例 */
  public async acquire() {
    return this.pool.acquire();
  }

  /** 释放一个实例 */
  public async release(instance: puppeteer.Browser) {
    return this.pool.release(instance);
  }
}

const launchOption: LaunchOptions = {
  headless: true,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    /** 关闭 XSS Auditor */
    '--disable-xss-auditor', //
    '--no-zygote',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    /** 允许不安全内容 */
    '--allow-running-insecure-content',
    '--disable-webgl',
    '--disable-popup-blocking',
    /** 配置代理 */
    // '--proxy-server=http://127.0.0.1:8080',
  ],
};

export const puppeteerPool = new PuppeteerPool({
  min: 1,
  max: 10,
  puppeteerArgs: launchOption,
});
