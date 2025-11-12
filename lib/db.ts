import mysql from 'mysql2/promise';

declare global {
  // Allow global pooling across hot reloads in Next.js
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Optional SSL support for hosted MySQL (PlanetScale, managed providers)
const useSSL = String(process.env.MYSQL_SSL || '').toLowerCase() === 'true';
const rejectUnauthorized = String(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
const ca = process.env.MYSQL_SSL_CA; // Base64 or raw pem (provider dependent)

const pool =
  global._mysqlPool ||
  mysql.createPool({
    host: getRequiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: getRequiredEnv('MYSQL_USER'),
    password: getRequiredEnv('MYSQL_PASSWORD'),
    database: getRequiredEnv('MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 20), // Increased pool size
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: useSSL
      ? {
          rejectUnauthorized,
          ca: ca,
        }
      : undefined,
  });

// In development, cache the pool globally so hot reloads don’t create new pools
if (process.env.NODE_ENV !== 'production') {
  global._mysqlPool = pool;
}

export { pool };

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error: any) {
    console.error('Database query error:', error.message);
    // Return empty array if database is not available
    return [];
  }
}

export async function execute(sql: string, params: any[] = []) {
  try {
    const [result] = await pool.execute(mysql.format(sql, params));
    return result as mysql.ResultSetHeader;
  } catch (error: any) {
    console.error('Database execute error:', error.message);
    // Return a mock result if database is not available
    return { insertId: 0, affectedRows: 0 } as mysql.ResultSetHeader;
  }
}
