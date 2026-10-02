import { Pool } from "pg";
import { env } from "./env.js";

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error: Error) => {
  console.error("PostgreSQL pool error:", error);
});

export async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ PostgreSQL connected");
  } finally {
    client.release();
  }
}

export { pool };
export default pool;