import { BrowserActionRecord } from './browser-record.js';

export type ReportInfo = {
  reportId: string;
  reportName: string;
  version: string;
  target_system: string;
  start_date: string;
  end_date: string;
};

export type LaunchForm = {
  /** 扫描任务ID */
  scanId: string;
  /** 目标URL */
  target: string;
  /** 是否扫描子域名 */
  scanSubdomain?: boolean;
  /** 扫描速度 */
  scanSpeed?: number;
  /** 排除路径 */
  excludePath?: string[];
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 自定义cookies */
  cookies?: Record<string, string>;
  /** 自定义localStorage */
  localStorages?: { name: string; value: string }[];
  /** 是否播放浏览器录制信息，  */
  recordJson?: BrowserActionRecord;
  /** 报告信息 */
  reportInfo: ReportInfo;
};
