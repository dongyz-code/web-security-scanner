import { uuidMd5 } from '@/configs/pkg.js';
import SCANNER from '@/hooks/scanner/index.js';
import type { Routes } from '@/types/routes.js';
import { pgsql, SqlData, tables } from '@/database/index.js';

type API = Routes['/main/create-scan'];

const index: API = {
  method: 'POST',
  url: '/main/create-scan',
  async handler({ body: launchForm }) {
    const scan_id = uuidMd5();

    const { recordJson, localStorages, cookies, ...rest } = launchForm;
    const data: Omit<SqlData['scan_record'], 'timestamp'> = {
      ...rest,
      scan_id,
      status: 'running',
      record_json: JSON.stringify(recordJson),
      local_storages: '',
      headers: '',
      create_time: new Date(),
    };

    await pgsql.insert({
      table: tables.scan_record,
      data: [data],
    });

    try {
      await SCANNER.launchWebBrowser({ ...launchForm, scan_id });
      await pgsql.query(`update ?? set status = 'success' where scan_id = ?`, [
        tables.scan_record,
        scan_id,
      ]);
      return {
        scan_id,
      };
    } catch (error) {
      await pgsql.query(`update ?? set status = 'failed' where scan_id = ?`, [
        tables.scan_record,
        scan_id,
      ]);
      throw error;
    }
  },
};

export default index;
