import { PostgreSql } from '@m170/sql';
import type { BASE_COL_TYPE } from '@m170/logics/tables-pgsql';

/** 字段类型 */
export type MODEL = BASE_COL_TYPE & {};

/** 基础 PG 配置 */
export const basePgOpts: ConstructorParameters<typeof PostgreSql>[0] = {
  max: 200,
  keepAlive: true,
};
