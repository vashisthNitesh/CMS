import "server-only";
import { Pool } from "pg";

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
          }
        : {
              host: process.env.DB_HOST || "localhost",
              port: parseInt(process.env.DB_PORT || "5432"),
              database: process.env.DB_NAME || "cms_foundation",
              user: process.env.DB_USER || "postgres",
              password: process.env.DB_PASSWORD || "postgres",
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
          }
);

export default pool;
