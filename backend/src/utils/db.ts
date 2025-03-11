// Database utility functions for working with Cloudflare D1

/**
 * Execute a SQL query with parameters
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The parameters for the query
 * @returns The result of the query
 */
export async function executeQuery(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

/**
 * Execute a SQL query and return all rows
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The parameters for the query
 * @returns An array of rows
 */
export async function queryAll<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await db.prepare(query).bind(...params).all();
    return result.results as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

/**
 * Execute a SQL query and return the first row
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The parameters for the query
 * @returns The first row or null if no rows were returned
 */
export async function queryOne<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const result = await db.prepare(query).bind(...params).first();
    return result as T | null;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

/**
 * Execute a SQL query to insert a row and return the ID
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The parameters for the query
 * @returns The ID of the inserted row
 */
export async function insert(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<number> {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Database insert error:', error);
    throw new Error('Database insert failed');
  }
}

/**
 * Execute a SQL transaction with multiple queries
 * @param db The D1 database instance
 * @param queries An array of SQL queries and their parameters
 * @returns The results of all queries
 */
export async function transaction(
  db: D1Database,
  queries: { query: string; params: any[] }[]
): Promise<D1Result[]> {
  const results: D1Result[] = [];
  
  try {
    // D1 doesn't support transactions directly yet, so we execute queries sequentially
    for (const { query, params } of queries) {
      const result = await db.prepare(query).bind(...params).run();
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Database transaction error:', error);
    throw new Error('Database transaction failed');
  }
}

/**
 * Initialize the database schema
 * @param db The D1 database instance
 */
export async function initializeSchema(db: D1Database): Promise<void> {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      encrypted_api_key TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `;
  
  const createChatsTable = `
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `;
  
  const createFlashcardsTable = `
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `;
  
  try {
    await executeQuery(db, createUsersTable);
    await executeQuery(db, createChatsTable);
    await executeQuery(db, createMessagesTable);
    await executeQuery(db, createFlashcardsTable);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}
