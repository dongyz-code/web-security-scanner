import { PuppeteerPool } from '@/utils/index.js';
import type { LaunchOptions, Page } from 'puppeteer';

const launchOption: LaunchOptions = {
  headless: true,
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
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

type Form = {
  url: string;
};

export async function launchWebBrowser(form: Form) {
  const { url } = form;
  const pool = new PuppeteerPool({
    min: 1,
    max: 10,
    puppeteerArgs: launchOption,
    validator: async (instance) => {
      return true;
    },
  });

  const browser = await pool.acquire();
  const page = await browser.newPage();
  /** 拦截请求 */
  await page.setRequestInterception(true);

  /** 监听请求 */
  page.on('request', (request) => {
    console.log(request.url());
  });

  page.on('response', (response) => {
    console.log(response.url());
  });

  await page.goto(url, {
    timeout: 60 * 1000,
    /** 等待网络连接在500ms没有超过两个请求 */
    waitUntil: 'networkidle2',
  });
}
