/**
 * 1. 全局错误消息
 * 2. 错误消息返回给前端的 CODE
 *
 */

import type { LiteralUnion } from '@m170/types';
import { errorSymbol } from '@m170/fastify';

export const ERROR_MSG_SPLIT = '\n';

function helper<WithParams extends string, JustString extends string>({
  withParams,
  justString,
}: {
  withParams: WithParams[];
  justString: JustString[];
}) {
  const withP = {} as {
    [key in WithParams]: (params: any) => string;
  };
  const justS = {} as {
    [key in JustString]: string;
  };

  justString.forEach((key) => {
    justS[key] = key;
  });

  withParams.forEach((key) => {
    withP[key] = (params: any) => {
      const val = typeof params === 'object' ? JSON.stringify(params) : params;
      return `${key}${ERROR_MSG_SPLIT}${val}`;
    };
  });

  return {
    ...withP,
    ...justS,
  };
}

/** 全局错误 */
export const ROOT_ERROR = helper({
  withParams: ['数据表: 不允许操作的表', '数据表: 仅读'],
  justString: [
    '系统配置: 配置文件不存在',
    '系统配置: PG 配置不存在',
    '系统配置: 邮件配置不存在',
    /** ------ */
    '非法参数',
    '校验失败',
    '暂未开放',
    '数据异常，请刷新重试',
    '服务到期',
    '处理失败',
    /** ------ */
    '身份认证失败',
    '未授权登录',
    '签名校验失败',
    '无权限',
    /** ------ */
    '已存在同名角色',
    '已存在同名用户',
    /** ------ */
    '重复的品牌名称',
    '品牌名称不能为空',
    /** 标签相关 */
    '该类型已存在',
    '该标签值已存在',
    '已经是前置节点了',
    '已经是后置节点了',
    '已经是根节点了，无效操作',
    '已经是子节点了，无效操作',
    '不能直接交换父子元素，无效操作',
    /** ----- */
    '已经在审批流程中了',
    '审批意见不能为空',
    /** ------- */
    '相关文件不存在',
    '文件列表为空',
    /** ------- */
    '数据表不为空',
    /** ------- */
    '不允许上传文件',
    '下载过于频繁，已限制下载功能',
    /** ---- */
    '任务互斥',
    '任务不存在',
    '无SSO相关配置',
    /** ---- */
    '尚未更新，请尝试更新数据后重试',
    '人群包HCP数量为空',
    'BRAND_ID 不能为空',
    '未知BRAND_ID',
    /** ---------------------- 接口相关 ---------------------- */
    '验证失败',
    '已禁用',
    /** ---------------------- 身份认证 ---------------------- */
    '未启用该账户，请联系管理员',
    '该账户已禁用，请联系管理员',
  ],
});

type ROOT_ERROR_KEY = keyof typeof ROOT_ERROR;

/** 有 响应CODE 的错误 */
const ROOT_ERROR_CODE: Partial<Record<ROOT_ERROR_KEY, string>> = {
  身份认证失败: '401',
};

/** 获取错误的响应码/消息 */
export const getRespErrorCodeMsg = (
  msg: LiteralUnion<ROOT_ERROR_KEY, string>,
) => {
  const cVal = (msg ?? '') as ROOT_ERROR_KEY;
  let code = '500';

  if (ROOT_ERROR_CODE[cVal]) {
    code = ROOT_ERROR_CODE[cVal] ?? code;
  } else {
    const index = cVal.indexOf(ERROR_MSG_SPLIT);
    if (index > -1) {
      const key = cVal.slice(0, index) as ROOT_ERROR_KEY;
      code = ROOT_ERROR_CODE[key] ?? code;
    }
  }
  return {
    [errorSymbol]: {
      code,
      msg,
    },
  };
};
