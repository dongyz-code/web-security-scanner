import { getHelper, pgsql, tables } from '@/database/index.js';
import { Routes } from '@/types/index.js';

type API = Routes['/main/scan-list'];

/** done  */
const index: API = {
  method: 'POST',
  url: '/main/scan-list',
  async handler() {
    const [list, count] = await Promise.all([
      getHelper({
        table: 'scan_record',
        fields: [
          'scan_id',
          'report_name',
          'version',
          'target_system',
          'start_date',
          'end_date',
          'target',
          'status',
          'create_time',
          'timestamp',
        ],
        suffix: {
          sql: 'ORDER BY create_time DESC',
        },
      }),
      pgsql.query<{ count: string }>('SELECT COUNT(*) FROM ??', [tables.scan_record]),
    ]);

    return {
      list,
      count: +count[0].count,
    };
  },
};

export default index;
