import { BloomFilter } from '@/utils/bloom-filter.js';
import { URL, parse, resolve } from 'node:url';
import { arrObject } from '@m170/utils/common';

/** 判断是否是静态资源 */
export function isStaticPath(url: string) {
  const staticType = arrObject([
    'css',
    'js',
    'jpg',
    'png',
    'gif',
    'svg',
    'ico',
    'webp',
    'woff',
    'woff2',
    'ttf',
    'eot',
    'otf',
    'mp4',
    'mp3',
    'wav',
    'ogg',
    'webm',
    'mp3',
  ]);
  const { pathname } = new URL(url);
  const filename = pathname.split('/').pop();
  const currentType = filename?.split('.').pop();
  return !!currentType && staticType[currentType];
}

/** 获取页面的src和href */
export function getPageSrcAndHref(elements: Element[]) {
  const result: string[] = [];
  for (const element of elements) {
    const src = element.getAttribute('src');
    const href = element.getAttribute('href');
    if (src) {
      result.push(src);
    }
    if (href) {
      result.push(href);
    }
  }
  return result;
}

export function parseLink(link: string, origin: string) {
  const { hostname, pathname } = parse(link);

  //排除根目录情况
  if (pathname == '/' || pathname == '#' || pathname == '/#') {
    return false;
  }

  // 处理相对路径
  if (!hostname && link.indexOf('javascript:') !== 0) {
    link = resolve(origin, link);
  }

  // 处理url以 // 开头的情况
  if (link.indexOf('//') === 0) {
    link = 'http:' + link;
  }

  // 除上述情况外均为不合法URL,丢弃
  if (link.indexOf('http') === -1) {
    return false;
  }

  // 检测是否在爬行范围
  const realUrl = new URL(link);
  if (origin.indexOf(realUrl.hostname) === -1) {
    return false;
  }

  return link;
}

/** 对爬到的url进行过滤 */
export function filterLinks(links: string[], origin: string, urlFilter: BloomFilter) {
  const result: string[] = [];

  for (let i = 0; i < links.length; i++) {
    const link = parseLink(links[i], origin);

    if (!link) {
      continue;
    }

    if (!urlFilter.has(link)) {
      result.push(link);
      urlFilter.add(link);
    }
  }

  return result;
}
