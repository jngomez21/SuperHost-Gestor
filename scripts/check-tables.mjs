import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select table_name from information_schema.tables where table_schema='public'`;
console.log(rows);
