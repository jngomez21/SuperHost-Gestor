import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/infrastructure/auth-schema.ts", "./src/infrastructure/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
