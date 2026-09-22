import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const result = await sql`select 1 as ok`;
console.log("Conexión a Neon OK:", result[0]);
