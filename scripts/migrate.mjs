import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "drizzle" });
console.log("Migraciones al día.");
