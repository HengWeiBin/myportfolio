import { neon } from '@netlify/neon';

const connectionString = process.env.REACT_APP_DATABASE_URL || process.env.DATABASE_URL;

let sqlClient = null;

if (connectionString) {
  try {
    sqlClient = neon(connectionString);
  } catch (err) {
    console.warn("Failed to initialize database client:", err.message);
  }
}

const sql = sqlClient || (async () => {
  console.warn("Direct database access is deprecated and disabled in public client bundles.");
  return [];
});

export default sql;
