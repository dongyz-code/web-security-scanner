import { join } from 'path';
import { arrObjectCluster, fse } from '@m170/utils/node';
import { getClusterLaunch } from '../puppeteer.js';
import { BloomFilter } from '@/utils/index.js';
import { STATIC_DATA_DIR, logger } from '@/configs/index.js';
import { getPageSrcAndHref, isStaticPath, filterLinks, parseLink } from '../utils.js';
import { checkHeaders } from './check.js';

import type { Page } from 'puppeteer';
import type { LaunchForm } from '@/types/index.js';
import { ScanResult } from '../type.js';
import { generateWord } from './report.js';

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
  maxDepth,
  scanSubdomain,
  scanSpeed = 5,
  excludePath,
  headers = {},
  cookies = {},
  localStorages = [],
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
      headers: Record<string, string>;
    }
  > = {};
  /** url去重 */
  const urlFilter = new BloomFilter(10000, 0.01);
  /** 已经扫描的url */
  const scannedFilter = new BloomFilter(10000, 0.01);
  /** 去掉target末尾的/ */
  target = target.replace(/\/$/, '');
  urlFilter.add(target);
  scannedFilter.add(target);
  urls.push(target);

  /** 图片占位图，替换实际图片 */
  const imagePlaceholder = await fse.readFile(join(STATIC_DATA_DIR, 'assets/placeholder.png'));

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

    /** 设置cookies */
    // await page.setCookie(...Object.entries(cookies).map(([name, value]) => ({ name, value, domain: target })));

    /** 监听请求 */
    page.on('request', async (request) => {
      // console.log('response', request.url());
      /** 拦截图片请求, 返回假的图片资源 */

      if (request.resourceType() === 'image') {
        request.respond({
          contentType: 'image/png',
          body: Buffer.from(imagePlaceholder),
        });
      } else {
        request.continue();
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (!parseLink(url, target)) {
        return;
      }

      console.log('url', url);
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
            headers: {},
          };
        }

        scanResultMap[v_type].headers = response.headers();
        if (pass) {
          scanResultMap[v_type].passUrls.push(url);
          scanResultMap[v_type].passCount++;
        } else {
          scanResultMap[v_type].failUrls.push(url);
          scanResultMap[v_type].failCount++;
        }
      });

      // if (contentType?.includes('application/json') || url.includes('/api/')) {
      //   console.log('json', url);
      //   const json = await response.json();
      //   console.log('json', json);
      // }
    });

    page.on('dialog', (dialog) => {
      dialog.dismiss();
    });

    await page.goto(target, {
      timeout: 60 * 1000,
      /** 等待网络连接在500ms没有超过两个请求 */
      waitUntil: 'networkidle2',
    });

    const links = await page.$$eval(
      '[src],[href],[action],[data-url],[longDesc],[lowsrc]',
      getPageSrcAndHref
    );

    const validLinks = filterLinks(links, target, urlFilter);
  });

  cluster.on('taskerror', (err) => {
    logger.error(err);
  });

  cluster.queue(target);

  await cluster.idle();

  await generateWord(Object.values(scanResultMap));

  await cluster.close();
}
