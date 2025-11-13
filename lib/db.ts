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

// Lazy initialization - only create pool when actually needed (not during build)
function getPool(): mysql.Pool {
  // Return existing pool if available
  if (global._mysqlPool) {
    return global._mysqlPool;
  }

  // Check if we're in build time or env vars are missing
  // During build, Next.js may analyze code but env vars aren't set
  // Also check for Vercel build environment
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.VERCEL_ENV === undefined && !process.env.MYSQL_HOST ||
    process.env.NODE_ENV === 'production' && !process.env.MYSQL_HOST && process.env.VERCEL !== '1';
  
  if (isBuildTime) {
    // During build, throw error that will be caught gracefully
    throw new Error(
      'Database not configured. Environment variables are required at runtime, not build time.'
    );
  }

  // Check if required env vars are present
  if (!process.env.MYSQL_HOST) {
    throw new Error('MYSQL_HOST environment variable is required');
  }

  // Optional SSL support for hosted MySQL (PlanetScale, managed providers)
  const useSSL = String(process.env.MYSQL_SSL || '').toLowerCase() === 'true';
  const rejectUnauthorized = String(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
  const ca = process.env.MYSQL_SSL_CA; // Base64 or raw pem (provider dependent)

  const pool = mysql.createPool({
    host: getRequiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: getRequiredEnv('MYSQL_USER'),
    password: getRequiredEnv('MYSQL_PASSWORD'),
    database: getRequiredEnv('MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10), // Reduced to prevent max_user_connections
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

  // Cache the pool globally to prevent multiple pools
  global._mysqlPool = pool;

  return pool;
}

// Export pool getter (for backwards compatibility)
export const pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof mysql.Pool];
  },
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const dbPool = getPool();
    const [rows] = await dbPool.query(sql, params);
    return rows as T[];
  } catch (error: any) {
    // During build time, return empty array to allow build to complete
    if (process.env.NEXT_PHASE === 'phase-production-build' || error.message?.includes('not configured')) {
      return [];
    }
    console.error('Database query error:', error.message);
    // Re-throw the error so API routes can handle it properly
    throw error;
  }
}

export async function execute(sql: string, params: any[] = []) {
  try {
    const dbPool = getPool();
    const [result] = await dbPool.execute(mysql.format(sql, params));
    return result as mysql.ResultSetHeader;
  } catch (error: any) {
    // During build time, return mock result to allow build to complete
    if (process.env.NEXT_PHASE === 'phase-production-build' || error.message?.includes('not configured')) {
      return { insertId: 0, affectedRows: 0 } as mysql.ResultSetHeader;
    }
    console.error('Database execute error:', error.message);
    // Re-throw the error so API routes can handle it properly
    throw error;
  }
}
