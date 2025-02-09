import { ROOT_CONF } from '../configs/static-conf.js';
import { MEDO_ENV } from '../configs/static-conf.js';
import { TransactionQuery, initTablesLogic, CreateOptSource } from '@m170/logics/tables-pgsql';
import { baseTableModel } from './models.js';
import { arrChunk, arrObject, getKeys } from '@m170/utils/node';
import { logger } from '../configs/logs.js';
import { basePgOpts, MODEL } from './type.js';

import type { Env } from '../types/index.js';

/** 获取表前缀 */
function getTablePrefix(_: Env = MEDO_ENV) {
  const PREFIX = `wsc_${_ === 'default' ? '' : `${_}_`}`.toLocaleLowerCase();
  return PREFIX;
}

/** 表前缀 */
export const TABLE_PREIFX = getTablePrefix();

/** 所有的表模型 */
export const {
  TYPE_MAP,
  pgsql,
  tables,
  tableModels,
  tableInit,
  tableHealthCheck,
  tableStructureReset,
  tableInsertDisableTrigger,
  getHelper,
  queryTransactionWrap,
} = initTablesLogic({
  colType: {} as MODEL,
  tableStructure: {
    ...baseTableModel,
  },
  tableName(key) {
    return `${TABLE_PREIFX}${key}`;
  },
  pgConf: {
    ...ROOT_CONF.pg,
    ...basePgOpts,
  },
  logger: logger,
});

/** 所有表名 */
export type Table = (typeof TYPE_MAP)['Table'];

/** 数据库表模型 */
export type SqlData = (typeof TYPE_MAP)['SqlData'];

/** 获取所有表对象 */
export function getEnvTables(env: Env) {
  const PREFIX = getTablePrefix(env);
  return arrObject(
    getKeys(tableModels).map((key) => ({
      key,
      name: PREFIX + key,
    })),
    'key',
    'name'
  ) as Record<Table, string>;
}

/**
 * 数据更新相关，先在新表插入数据，最后删除重命名在一个事务完成
 */
export const tableStructureResetV2 = {
  async create(keys: Table[]) {
    return pgsql.transactions(async (query) => {
      const min = async (key: Table) => {
        const table = tables[key];
        const tempTable = `${table}_reset_temp`;
        const createOpt: CreateOptSource = tableModels[key];

        await pgsql.createTable({
          ...createOpt,
          table: tempTable,
          drop: true,
          query,
        });
        return {
          key,
          tempTable,
        };
      };
      return Promise.all(keys.map(min));
    });
  },

  async rename({ key, query }: { key: Table; query: TransactionQuery }) {
    const table = tables[key];
    const tempTable = `${table}_reset_temp`;
    await query(`ALTER TABLE ?? ENABLE TRIGGER ALL`, [tempTable]);
    await query(`DROP TABLE IF EXISTS ??`, [table]);
    await query(`ALTER TABLE ?? RENAME TO ??`, [tempTable, table]);
  },

  async insert({ key, data }: { key: Table; data: unknown[] }) {
    const table = tables[key];
    const tempTable = `${table}_reset_temp`;
    const createOpt: CreateOptSource = tableModels[key];
    await pgsql.transactions(async (query) => {
      await pgsql.createTable({
        ...createOpt,
        table: tempTable,
        drop: true,
        query,
      });
      await tableInsertDisableTrigger({
        table: tempTable,
        data,
        query,
      });
    });
  },

  /** 插入数据到临时表 */
  async insertIgnore({ key, data }: { key: Table; data: Record<string, unknown>[] }) {
    if (!data.length) {
      return;
    }

    const table = tables[key];
    const tempTable = `${table}_reset_temp`;

    await pgsql.transactions(async (query) => {
      const fields = getKeys(data[0]);
      const minData = arrChunk(data, 1e4);

      data.length = 0;

      const q = `INSERT INTO ?? (??) VALUES ? ON CONFLICT DO NOTHING`;

      for (let i = 0; i < minData.length; i++) {
        const items = minData[i];
        await query(q, [tempTable, fields, items.map((e) => fields.map((x) => e[x]))]);
        items.length = 0;
      }
    });
  },
};
