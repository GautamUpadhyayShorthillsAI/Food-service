import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { DBConfig } from "../config";

// Create postgres connection
const conn = postgres(DBConfig.url, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 60, // Connection timeout in seconds
});

// Create Drizzle database instance
export const db = drizzle(conn, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Connection test function
export async function testConnection() {
  try {
    await conn`SELECT 1`;
    console.log('✅ Database connected successfully with postgres-js');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Close database connection
export async function closeConnection() {
  try {
    await conn.end();
    console.log('📪 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Export schema for use in other modules
export * from './schema';
export type Database = typeof db;