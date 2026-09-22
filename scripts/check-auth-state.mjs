import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
console.log("users:", await sql`select id, email, "emailVerified" from "user"`);
console.log("sessions:", await sql`select * from "session"`);
console.log("verificationTokens:", await sql`select identifier, expires from "verificationToken"`);
