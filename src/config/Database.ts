import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Sequelize instance for database connection
 * Configured with environment variables
 */
class DatabaseConfig {
  private static instance: Sequelize;

  /**
   * Get or create Sequelize instance
   */
  static getInstance(): Sequelize {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new Sequelize({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'maxhub_erp',
        dialect: 'mysql',
        logging:
          process.env.NODE_ENV === 'production'
            ? false
            : process.env.LOG_SQL === 'true'
              ? console.log
              : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '10'),
          min: parseInt(process.env.DB_POOL_MIN || '2'),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
        },
        timezone: process.env.DB_TIMEZONE || '+00:00',
        define: {
          timestamps: true,
          paranoid: true, // Soft deletes enabled
          underscored: true,
        },
      });
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
      await sequelize.sync({ alter: !force, force });
      console.log('✅ Database schema synced');
    } catch (error) {
      console.error('❌ Database sync failed:', error);
      throw error;
    }
  }
}

export default DatabaseConfig;
