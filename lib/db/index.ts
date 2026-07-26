import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL || "";

function getDb() {
  if (!connectionString || connectionString.includes("placeholder")) {
    // Development fallback mock ORM or basic warning helper
    return null;
  }
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

export const db = getDb();
