import { BrowserActionRecord } from './browser-record.js';

export type LaunchForm = {
  /** 扫描任务ID */
  scan_id: string;
  /** 目标URL */
  target: string;
  /** 报告名称 */
  report_name: string;
  /** 报告版本 */
  version: string;
  /** 目标系统 */
  target_system: string;
  /** 开始时间 */
  start_date: string;
  /** 结束时间 */
  end_date: string;
  /** 扫描速度 */
  scanSpeed?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 自定义cookies */
  cookies?: Record<string, string>;
  /** 自定义localStorage */
  localStorages?: { name: string; value: string }[];
  /** 是否播放浏览器录制信息，  */
  recordJson?: BrowserActionRecord;
};

export type ScanListResult = {
  scan_id: string;
  report_name: string;
  version: string | null;
  target_system: string;
  start_date: string;
  end_date: string;
  target: string;
  status: 'success' | 'failed' | 'pending' | 'running';
  create_time: Date;
  timestamp: Date;
};
