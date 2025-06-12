import { DatabaseAdapter, SQLiteAdapter, CosmosAdapter } from "./database/index.js";

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

function createDatabase(dbUrl?: string): DatabaseAdapter {
  // Choose adapter based on environment
  const connectionString = dbUrl || DATABASE_URL;
  const adapter = connectionString 
    ? new CosmosAdapter(connectionString)
    : new SQLiteAdapter();
  
  // Initialize the adapter
  adapter.initialize().catch(error => {
    console.error("Failed to initialize database:", error);
  });

  // Return a proxy that automatically waits for initialization
  return new Proxy(adapter, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      // If it's a method and not waitForInit, wrap it to wait for initialization
      if (typeof value === 'function' && prop !== 'waitForInit' && prop !== 'initialize') {
        return async function(...args: any[]) {
          await target.waitForInit();
          return value.apply(target, args);
        };
      }
      
      return value;
    }
  });
}

export class Database {
  static async create(dbUrl?: string): Promise<DatabaseAdapter> {
    const db = createDatabase(dbUrl);
    await db.waitForInit();
    return db;
  }
}

// Export singleton instance
export const database = createDatabase();

