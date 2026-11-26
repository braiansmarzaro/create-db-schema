# create-db-schema

Connect to a PostgreSQL database and generate a [DBML](https://dbml.dbdiagram.io) schema from it.

The package exposes helper functions that query PostgreSQL's catalog (tables, views, columns, primary keys, indexes, foreign keys and comments) and a builder that turns the results into DBML.

## Requirements

- Node.js >= 18
- A PostgreSQL database you can connect to

## Installation

```bash
npm install create-db-schema
```

## Usage

```js
import pg from 'pg';
import {
  fetchTables,
  fetchViews,
  fetchColumns,
  fetchPrimaryKeys,
  fetchAllIndexes,
  fetchForeignKeys,
  fetchTableComments,
  fetchColumnComments,
  buildDbml,
} from 'create-db-schema';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const tables = await fetchTables(client);
const columns = await fetchColumns(client);
// ...fetch the rest, then pass the results to buildDbml (see lib/dbml.js)

await client.end();
```

## API

| Export | Description |
| --- | --- |
| `fetchTables(client)` | List tables |
| `fetchViews(client)` | List views |
| `fetchColumns(client)` | List columns |
| `fetchPrimaryKeys(client)` | List primary keys |
| `fetchAllIndexes(client)` | List indexes |
| `fetchForeignKeys(client)` | List foreign keys |
| `fetchTableComments(client)` | Table comments |
| `fetchColumnComments(client)` | Column comments |
| `toDbmlType(...)` | Map a PostgreSQL type to a DBML type |
| `columnSettings(...)` | Build the DBML settings for a column |
| `buildDbml(...)` | Assemble the final DBML text |

See [`lib/queries.js`](lib/queries.js) and [`lib/dbml.js`](lib/dbml.js) for exact signatures.

## License

MIT © Deivid Smarzaro
