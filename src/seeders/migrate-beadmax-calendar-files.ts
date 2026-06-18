/**
 * MaxHub ERP — BeadMax / Calendar / Files schema migration
 * One-off script: creates the customer, order_tracking, calendar_events, and
 * file_records tables (all brand new, so plain sequelize.sync() / CREATE TABLE
 * IF NOT EXISTS is enough, no ALTER needed). These models previously
 * self-initialized at import time and were never registered on the app's
 * sequelize instance before sync() ran, so their tables were never created.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-beadmax-calendar-files.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { Customer } from '../models/Customer.model';
import { OrderTracking } from '../models/OrderTracking.model';
import { CalendarEvent } from '../models/CalendarEvent.model';
import { FileRecord } from '../models/FileRecord.model';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const SSL_OPTIONS = { require: true, rejectUnauthorized: false };

  const sequelize = dbUrl
    ? new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
      })
    : new Sequelize({
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
      });

  await sequelize.authenticate();

  console.log('\n🔄  Creating customer, order_tracking, calendar_events, file_records tables...\n');
  Customer.initModel(sequelize);
  OrderTracking.initModel(sequelize);
  CalendarEvent.initModel(sequelize);
  FileRecord.initModel(sequelize);
  OrderTracking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Customer.hasMany(OrderTracking, { foreignKey: 'customerId', as: 'orders' });
  await sequelize.sync();
  console.log('✅  Tables ready\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
