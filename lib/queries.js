/**
 * PostgreSQL-specific schema introspection queries.
 * Each function accepts a pg client and returns structured data.
 */

export async function fetchTables(client) {
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return rows.map((r) => r.table_name);
}

export async function fetchViews(client) {
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  return rows.map((r) => r.table_name);
}

export async function fetchColumns(client) {
  const { rows } = await client.query(`
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  return rows;
}

export async function fetchPrimaryKeys(client) {
  const { rows } = await client.query(`
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema    = 'public'
    ORDER BY kcu.table_name, kcu.ordinal_position
  `);
  // { tableName -> Set<columnName> }
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, new Set());
    map.get(r.table_name).add(r.column_name);
  }
  return map;
}

export async function fetchAllIndexes(client) {
  const { rows } = await client.query(`
    SELECT
      t.relname                                        AS table_name,
      i.relname                                        AS index_name,
      ix.indisunique                                   AS is_unique,
      array_agg(a.attname ORDER BY k.ord)              AS columns
    FROM pg_class t
    JOIN pg_index ix ON ix.indrelid = t.oid AND NOT ix.indisprimary
    JOIN pg_class i  ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum AND a.attnum > 0
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
    GROUP BY t.relname, i.relname, ix.indisunique
    ORDER BY t.relname, i.relname
  `);
  // { tableName -> Array<{ name, isUnique, columns }> }
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, []);
    // pg may return array_agg as a JS array or as a "{a,b}" string — normalise both
    const columns = Array.isArray(r.columns)
      ? r.columns
      : r.columns.replace(/^\{|\}$/g, '').split(',');
    map.get(r.table_name).push({
      name: r.index_name,
      isUnique: r.is_unique,
      columns,
    });
  }
  return map;
}

export async function fetchForeignKeys(client) {
  const { rows } = await client.query(`
    SELECT
      kcu.table_name   AS from_table,
      kcu.column_name  AS from_column,
      ccu.table_name   AS to_table,
      ccu.column_name  AS to_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
     AND tc.table_schema    = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name   = ccu.constraint_name
     AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema    = 'public'
    ORDER BY from_table, from_column
  `);
  return rows;
}

export async function fetchTableComments(client) {
  const { rows } = await client.query(`
    SELECT
      c.relname  AS table_name,
      d.description
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_description d ON d.objoid = c.oid AND d.objsubid = 0
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND d.description IS NOT NULL
    ORDER BY c.relname
  `);
  const map = new Map();
  for (const r of rows) map.set(r.table_name, r.description);
  return map;
}

export async function fetchColumnComments(client) {
  const { rows } = await client.query(`
    SELECT
      c.relname  AS table_name,
      a.attname  AS column_name,
      d.description
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_catalog.pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND d.description IS NOT NULL
    ORDER BY c.relname, a.attnum
  `);
  // { tableName -> Map<columnName, description> }
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, new Map());
    map.get(r.table_name).set(r.column_name, r.description);
  }
  return map;
}
