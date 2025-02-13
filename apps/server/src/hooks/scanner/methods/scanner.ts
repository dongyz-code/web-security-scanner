import { join } from 'path';
import { fse } from '@m170/utils/node';
import { getClusterLaunch } from '../puppeteer.js';
import { BloomFilter } from '@/utils/index.js';
import { STATIC_DATA_DIR, logger } from '@/configs/index.js';
import { getPageSrcAndHref, filterLinks, parseLink } from '../utils.js';
import { checkHeaders } from './check.js';
import { generateWord } from './report.js';

import type { LaunchForm } from '@/types/index.js';
import { handleRecord } from './record.js';

/**
 * 路由扫描
 * 1. 先对路径进行收集，
 *   - 收集页面中href src data-src action longDesc lowsrc
 *   - 执行event事件，收集路由
 * 2. 收集的过程中对XSS 请求头 SQL注入等扫描
 * @param form 扫描参数
 */

export async function launchWebBrowser({
  target,
  scanSpeed = 10,
  headers = {},
  localStorages = [],
  recordJson,
  reportInfo,
}: LaunchForm) {
  /** 收集的网站路径 */
  const urls: string[] = [];
  /** 漏洞扫描 */
  const scanResultMap: Record<
    string,
    {
      v_type: string;
      passCount: number;
      failCount: number;
      passUrls: string[];
      failUrls: string[];
      successHeaders: Record<string, string>;
      errorHeaders: Record<string, string>;
    }
  > = {};
  /** url去重 */
  const urlFilter = new BloomFilter(10000, 0.01);
  /** 去掉target末尾的/ */
  target = target.replace(/\/$/, '');
  urlFilter.add(target);
  urls.push(target);

  /** 启动浏览器 */
  const cluster = await getClusterLaunch({ maxConcurrency: scanSpeed });

  cluster.task(async ({ page, data: url }) => {
    /** 拦截请求 */
    await page.setRequestInterception(true);

    /** 设置请求头 */
    await page.setExtraHTTPHeaders(headers);

    /** 设置localStorage */
    await page.evaluateOnNewDocument((localStorages) => {
      localStorages.forEach(({ name, value }) => {
        window.localStorage.setItem(name, value);
      });
    }, localStorages);

    /** 监听请求 */
    page.on('request', async (request) => {
      request.continue();
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (!parseLink(url, target, urlFilter)) {
        return;
      }

      const checks = await checkHeaders(response);
      checks.forEach((check) => {
        const { v_type, pass, url } = check;

        if (!scanResultMap[v_type]) {
          scanResultMap[v_type] = {
            v_type,
            passCount: 0,
            failCount: 0,
            passUrls: [],
            failUrls: [],
            successHeaders: {},
            errorHeaders: {},
          };
        }

        const headers = response.headers();

        if (pass) {
          scanResultMap[v_type].passUrls.push(url);
          scanResultMap[v_type].passCount++;
          scanResultMap[v_type].successHeaders = headers;
        } else {
          scanResultMap[v_type].failUrls.push(url);
          scanResultMap[v_type].failCount++;
          scanResultMap[v_type].errorHeaders = headers;
        }
      });
    });

    page.on('dialog', (dialog) => {
      dialog.dismiss();
    });

    if (recordJson) {
      await handleRecord(page, recordJson);
    } else {
      await page.goto(target, {
        timeout: 60 * 1000,
        /** 等待网络连接在500ms没有超过两个请求 */
        waitUntil: 'networkidle2',
      });
    }

    // const links = await page.$$eval(
    //   '[src],[href],[action],[data-url],[longDesc],[lowsrc]',
    //   getPageSrcAndHref
    // );

    // const validLinks = filterLinks(links, target, urlFilter);
  });

  cluster.on('taskerror', (err) => {
    logger.error(err);
  });

  cluster.queue(target);

  await cluster.idle();

  // console.log('scanResultMap', scanResultMap);
  await generateWord(Object.values(scanResultMap), reportInfo);

  await cluster.close();
}
