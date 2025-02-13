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
  scan_record: {
    comment: '扫描记录',
    cols: {
      scan_id: {
        type: 'varchar(255)',
        primary: true,
        index: true,
        tsType: 'string',
      },
      report_name: {
        type: 'varchar(255)',
        comment: '报告名称',
        tsType: 'string',
        noNull: true,
      },
      version: {
        type: 'varchar(255)',
        comment: '扫描版本',
        tsType: 'string',
      },
      target_system: {
        type: 'varchar(255)',
        comment: '扫描目标系统',
        tsType: 'string',
        noNull: true,
      },
      start_date: {
        type: 'varchar(32)',
        comment: '扫描开始日期',
        tsType: 'string',
        noNull: true,
      },
      end_date: {
        type: 'varchar(32)',
        comment: '扫描结束日期',
        tsType: 'string',
        noNull: true,
      },
      target: {
        type: 'varchar(255)',
        comment: '扫描目标URL',
        tsType: 'string',
        noNull: true,
      },
      record_json: {
        type: 'text',
        comment: 'Chrome浏览器导出的扫描记录JSON',
        tsType: 'string',
      },
      headers: {
        type: 'text',
        comment: '注入的请求头',
        tsType: 'string',
      },
      local_storages: {
        type: 'text',
        comment: '注入的localStorage',
        tsType: 'string',
      },
      status: {
        type: 'varchar(255)',
        comment: '扫描状态(pending, running, success, failed)',
        tsType: 'string',
        noNull: true,
      },
      create_time: {
        type: 'timestamptz(6)',
        tsType: 'date',
        noNull: true,
      },
      timestamp: {
        type: 'timestamptz(6)',
        tsType: 'date',
        noNull: true,
      },
    },
    timestampTriggerStatus: {
      status: ['INSERT', 'UPDATE'],
      fields: ['timestamp'],
    },
  },
});
