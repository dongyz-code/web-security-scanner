import type { CreateOpt } from '@m170/logics/tables-pgsql';
import type { MODEL } from './type.js';

function helper<T extends Record<string, CreateOpt<MODEL>>>(data: T) {
  return data;
}

/** 表模型 */
export const baseTableModel = helper({
  /** 系统设置 */
  sys_conf: {
    comment: '系统配置',
    cols: {
      data: {
        type: 'text',
        tsType: 'string',
      },
    },
  },
});
