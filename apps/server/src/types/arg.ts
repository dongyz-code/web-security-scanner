import type { Env } from '@pkg/types/index.js';

/** 项目启动配置文件 */
export interface CONF {
  pg: {
    host: string;
    port: number;
    database: string;
    path: string;
    user: string;
    password: string;
  };
  administrator: {
    user_id: string;
    password: string;
    nickname: string;
    mail: string;
  };
  mail?: {
    host: string;
    port: number;
    auth: {
      user: string;
      pass: string;
    };
    title: string;
  };
  sso?: {
    /** 前端认证 URL */
    authorization: string;
    /** access_token URL */
    access_token: string;
    client_id: string;
    client_password: string;
    domain: string;
  };
  es: {
    host: string;
    user: string;
    password: string;
  };
  MEDO_ENV?: Env;
}

type Val01 = '1' | '0';

/** 环境变量： mode +  DOCKERPORT */
export interface ROOTENV {
  /** 自定义环境区分，默认应该是 default */
  MEDO_ENV?: Env;
  /** 依次是: IS_AWS, IS_DOCKER */
  MEDO_ENV_CONF?: `${Val01}${Val01}`;
  /** 域名 */
  DOMAIN?: string;
  /** 性能优化（可选） */
  NODE_ENV?: 'production';
}
