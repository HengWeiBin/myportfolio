import { neon } from '@netlify/neon';

const connectionString = process.env.REACT_APP_DATABASE_URL;

if (!connectionString) {
    console.error("Database connection string (REACT_APP_DATABASE_URL) is missing!");
}

const sql = neon(connectionString);

export default sql;
