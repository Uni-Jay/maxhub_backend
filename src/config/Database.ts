import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const SSL_OPTIONS = {
  require: true,
  rejectUnauthorized: false,
};

const logging =
  process.env.NODE_ENV === 'production'
    ? false
    : process.env.LOG_SQL === 'true'
      ? console.log
      : false;

// Supabase session pooler caps total clients at 15. Local dev and Render
// production share the same DATABASE_URL, so each process must stay well
// under that limit rather than each claiming up to 15-20 connections.
const POOL = {
  max:     parseInt(process.env.DB_POOL_MAX     || '5'),
  min:     parseInt(process.env.DB_POOL_MIN     || '0'),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
  idle:    parseInt(process.env.DB_POOL_IDLE    || '10000'),
};

const DEFINE = {
  timestamps: true,
  paranoid:   true,
  underscored: true,
};

// Retries transient connection failures (DNS blips, resets) instead of
// failing the request outright — e.g. the Supabase pooler hostname
// occasionally has a brief DNS resolution hiccup (ENOTFOUND).
const RETRY = {
  max: 3,
  match: [
    /ETIMEDOUT/,
    /EHOSTUNREACH/,
    /ECONNRESET/,
    /ECONNREFUSED/,
    /ENOTFOUND/,
    /ESOCKETTIMEDOUT/,
    /EPIPE/,
    /SequelizeConnectionError/,
    /SequelizeConnectionRefusedError/,
    /SequelizeHostNotFoundError/,
    /SequelizeHostNotReachableError/,
    /SequelizeInvalidConnectionError/,
    /SequelizeConnectionTimedOutError/,
  ],
};

/**
 * Sequelize singleton — one connection for the entire app.
 * Prefers DATABASE_URL when set (Supabase / Railway / Render),
 * falls back to individual DB_* env vars.
 */
class DatabaseConfig {
  private static instance: Sequelize;

  static getInstance(): Sequelize {
    if (!DatabaseConfig.instance) {
      const url = process.env.DATABASE_URL;

      if (url) {
        DatabaseConfig.instance = new Sequelize(url, {
          dialect: 'postgres',
          logging,
          dialectOptions: { ssl: SSL_OPTIONS },
          pool: POOL,
          define: DEFINE,
          retry: RETRY,
        });
      } else {
        DatabaseConfig.instance = new Sequelize({
          host:     process.env.DB_HOST     || 'localhost',
          port:     parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER     || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME     || 'postgres',
          dialect: 'postgres',
          logging,
          dialectOptions: { ssl: SSL_OPTIONS },
          pool: POOL,
          define: DEFINE,
          retry: RETRY,
        });
      }
    }

    return DatabaseConfig.instance;
  }

  /**
   * Test database connection
   */
  static async testConnection(): Promise<void> {
    try {
      const sequelize = DatabaseConfig.getInstance();
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  static async closeConnection(): Promise<void> {
    const sequelize = DatabaseConfig.getInstance();
    if (sequelize) {
      await sequelize.close();
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Sync database schema
   * Use with caution in production
   */
  static async syncDatabase(force: boolean = false): Promise<void> {
    try {
      const sequelize = DatabaseConfig.getInstance();
      await sequelize.sync({ alter: true });
      console.log('✅ Database schema synced');
    } catch (error) {
      console.error('❌ Database sync failed:', error);
      throw error;
    }
  }
}

export { DatabaseConfig };
export default DatabaseConfig.getInstance();
