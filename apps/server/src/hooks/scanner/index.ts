import { fse } from '@m170/utils/node';
import { launchWebBrowser } from './methods/scanner.js';

launchWebBrowser({
  scanId: 'KoXo9898',
  target: 'https://p-gsk-kyc-qa.medomino.com',
  /** 浏览器录制信息 */
  recordJson: fse.readJSONSync('./static/record.json'),
  reportInfo: {
    reportId: 'OPOEE',
    reportName: '脉络洞察渗透测试报告',
    version: 'V1.0',
    target_system: 'GSK',
    start_date: '2025-01-01',
    end_date: '2025-01-01',
  },
})
  .then((res) => {
    console.log('res', res);
  })
  .catch((err) => {
    console.log('err', err);
  });
