/**
 * Programmatic API for create-db-schema.
 *
 * Use this when you want to integrate schema generation into your own scripts
 * instead of running the CLI.
 *
 * Example:
 *   import { fetchTables, fetchColumns, buildDbml } from 'create-db-schema';
 */

export {
  fetchTables,
  fetchViews,
  fetchColumns,
  fetchPrimaryKeys,
  fetchAllIndexes,
  fetchForeignKeys,
  fetchTableComments,
  fetchColumnComments,
} from './lib/queries.js';

export { toDbmlType, columnSettings, buildDbml } from './lib/dbml.js';

