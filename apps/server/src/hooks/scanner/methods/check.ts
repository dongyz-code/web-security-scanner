import { WEB_SECURITY_LIBRARY } from '../constant.js';
import type { HTTPResponse } from 'puppeteer';
import type { ScanResult } from '../type.js';

export async function checkHeaders(response: HTTPResponse) {
  const res: ScanResult[] = [];
  const url = response.url();

  WEB_SECURITY_LIBRARY.forEach((v) => {
    const pass = v.validate(response);
    res.push({ url, v_type: v.v_type, pass });
  });

  return res;
}
