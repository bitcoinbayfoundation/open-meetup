import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL;

export const isDbConfigured = !!connectionString;

export const pool = isDbConfigured
  ? new Pool({
      connectionString,
      ssl: connectionString?.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    })
  : (null as unknown as Pool);
