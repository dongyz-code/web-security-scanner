import { ScanListResult, LaunchForm } from '../_';

export type MainController = {
  '/scan-list': ScanList;
  '/download-report': ScanReportDownload;
  '/create-scan': CreateScan;
};

type ScanList = {
  method: 'POST';
  req: {};
  resp: {
    list: ScanListResult[];
    count: number;
  };
};

type ScanReportDownload = {
  method: 'POST';
  req: {
    scan_id: string;
  };
  resp: any;
};

type CreateScan = {
  method: 'POST';
  req: Omit<LaunchForm, 'scan_id'>;
  resp: {
    scan_id: string;
  };
};
