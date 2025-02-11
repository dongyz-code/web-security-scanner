export type LaunchForm = {
  /** 扫描任务ID */
  scanId: string;
  /** 目标URL */
  target: string;
  /** 最大扫描深度 */
  maxDepth?: number;
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
};
