import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Implement slow query logging for EACC monitoring
const originalQuery = pool.query;
pool.query = async function (text: any, params?: any, callback?: any): Promise<any> {
  const start = Date.now();
  try {
    const res = await originalQuery.apply(this, [text, params, callback] as any);
    const duration = Date.now() - start;
    if (duration > 100) { // Log queries slower than 100ms
      console.warn(`[SLOW_QUERY_LOGGER] Execution time: ${duration}ms | Query: ${typeof text === 'string' ? text : text?.text || 'Unknown'}`);
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[SLOW_QUERY_LOGGER] Error after ${duration}ms | Query: ${typeof text === 'string' ? text : text?.text || 'Unknown'} | Error: ${error}`);
    throw error;
  }
} as any;

export const db = drizzle(pool, { schema });
