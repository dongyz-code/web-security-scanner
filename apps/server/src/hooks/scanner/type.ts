export type ScanResult = {
  v_type: string;
  url: string;
  pass: boolean;
};

export type ScanResultMap = {
  v_type: string;
  passCount: number;
  failCount: number;
  passUrls: string[];
  failUrls: string[];
  successHeaders: Record<string, string>;
  errorHeaders: Record<string, string>;
};

export function helperDocxOptions<T extends undefined | readonly any[]>(data: T) {
  if (data === undefined) {
    return [];
  }
  return [...data];
}
