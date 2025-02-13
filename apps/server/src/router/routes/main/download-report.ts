import { fse } from '@m170/utils/node';
import { REPORT_DIR } from '@/configs/static.js';
import type { Routes } from '@/types/index.js';
import path from 'path';

type API = Routes['/main/download-report'];

const index: API = {
  method: 'POST',
  url: '/main/download-report',
  async handler({ body: { scan_id } }, reply) {
    if (!scan_id) {
      throw new Error('scan_id is required');
    }

    const filepath = path.join(REPORT_DIR, `${scan_id}.docx`);
    if (!(await fse.exists(filepath))) {
      throw new Error('report not found');
    }

    reply.header('Content-Disposition', `attachment; filename="${scan_id}.docx"`);
    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Length', (await fse.stat(filepath)).size);
    reply.send(fse.createReadStream(filepath));
  },
};

export default index;
