import { arrObject } from '@m170/utils/common';

/** 判断是否是静态资源 */
export function isStaticPath(url: string) {
  const staticType = arrObject(['css', 'js', 'jpg', 'png', 'gif', 'svg']);
  const { pathname } = new URL(url);
  const filename = pathname.split('/').pop();
  const currentType = filename?.split('.').pop();
  return !!currentType && staticType[currentType];
}

/** 对爬到的url进行过滤 */
export function cleaningUrl() {}
