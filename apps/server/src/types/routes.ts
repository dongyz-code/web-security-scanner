import type { APIRoutes, APISource } from '@m170/fastify';
import type { API } from '@pkg/types/index.js';
import type { TransactionQuery } from '@m170/sql';
import type { Simplify } from '@m170/types';

export type TokenData = {
  user_id: string;
  nickname: string;
  method: 'SSO' | 'PASSWORD';
  source: 'WEB-SECURITY-SCANNER';
  s: 0 | 1;
  /** ------------ */
  app_id?: string;
};

export type Routes = APIRoutes<
  API,
  {
    headers: {
      token: string;
      signature: string;
      __token: TokenData;
    };
  }
>['routes'];

export type RoutesSource = APISource<API>;

/** 所有请求包裹 */
export type WrapQuery<T extends Record<string, any> = {}, MustQ extends boolean = false> = Simplify<
  {
    /** 不需要按事务处理 */
    justQuery?: boolean;
  } & T &
    (MustQ extends true
      ? { query: TransactionQuery }
      : {
          query?: TransactionQuery;
        })
>;

/** 拿到 API 包裹的接口定义 */
export type APIWrap<T extends keyof RoutesSource> = {
  req: WrapQuery<{
    body: RoutesSource[T]['req'];
    user_id: string;
    __token: TokenData;
    ip: string;
  }>;
  resp: Promise<Simplify<RoutesSource[T]['resp']>>;
};
