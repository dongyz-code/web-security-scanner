export type SYS_CONF = {
  loginMethod: 'SSO' | 'PASSWORD';
  /** 是否允许 sso code */
  enableSsoCode: boolean;
  /** 是否打开 MI 外链*/
  enableMiLink: boolean;
  /** 是否打开关系图 */
  enableRelation: boolean;
  /** 用户同步默认角色 */
  defaultUserRole: string;
};

/** 登录返回的信息 */
export type LOGIN_RESPONSE = {
  token: string;
  user: Pick<UserItem, 'user_id' | 'sys_admin' | 'nickname'>;
};

/** 用户基础信息 */
export type UserItem = {
  user_id: string;
  nickname: string | null;
  mail: string | null;
  available: 0 | 1;
  create_date: Date;
  timestamp: Date;
  /** 账户同步 / 手动添加 */
  user_source: 'SYNC' | 'ADD';
  role_id: string[];
  department: string | null;
  post: string | null;
  /** 是否是系统管理员 */
  sys_admin: boolean;
};
