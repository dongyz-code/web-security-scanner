import { Cluster } from 'puppeteer-cluster';
import { merge } from 'lodash-es';

import type { LaunchOptions } from 'puppeteer';

const launchOptions: LaunchOptions = {
  headless: true,
  devtools: false,
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

type ClusterLaunchOptions = Parameters<typeof Cluster.launch>[0];
const clusterLaunchOptions: ClusterLaunchOptions = {
  /** 单浏览器多TAB模式 */
  concurrency: 1,
  /** 最大并发数 */
  maxConcurrency: 10,
  /** 跳过重复URL */
  skipDuplicateUrls: true,
  /** 重试次数 */
  retryLimit: 3,
  /** 重试间隔 */
  retryDelay: 1000,
  /** puppeteer 启动选项 */
  puppeteerOptions: launchOptions,
  /** 监控 */
  monitor: false,
};

export function getClusterLaunch(options: { maxConcurrency: number }) {
  return Cluster.launch(merge(clusterLaunchOptions, options));
}
