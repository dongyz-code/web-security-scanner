import { Jwt, JWT_SECRET, ROOT_ERROR } from '../../configs/index.js';

export const jwt = new Jwt({
  secret: JWT_SECRET,
  expiresIn: '12h',
});

export const interfaceJwt = new Jwt({
  secret: JWT_SECRET + 'interface',
  expiresIn: '12h',
});

const getJwt = (url: string) => {
  if (url.startsWith('/api/interface/') && url !== '/api/interface/_') {
    return interfaceJwt;
  }
  return jwt;
};

/** 忽略 token 校验，会忽略后续的签名校验 */
const exceptToken = [
  /** --------- */
  '/api/login/login',
  '/api/sys/conf',
  '/api/login/h5Login',
  /** --------- */
  '/api/interface/token',
  '/api/sys/tempTable',
  '/api/main/scheduleRun',
];

/** 忽略签名校验 */
const exceptSign = [
  /** --------- */
  '/api/interface/',
];

type Req = {
  url: string;
  headers: any;
  body?: any;
};

/** 错误直接返回字符串, 不校验 body 这样就可以在预处理之外处理 */
export function authentication({ body, url, headers }: Req) {
  try {
    if (!exceptToken.some((x) => url.startsWith(x))) {
      const { token, signature } = headers;
      if (!token) {
        return new Error(ROOT_ERROR['身份认证失败']);
      }
      headers.__token = getJwt(url).verify(token);
      if (!exceptSign.some((x) => url.startsWith(x)) && !signature) {
        return new Error(ROOT_ERROR['签名校验失败']);
      }
    }
    return null;
  } catch (error) {
    return new Error(ROOT_ERROR['身份认证失败']);
  }
}
