/**
 * MaxHub ERP — Business Unit Department Seeder
 * Creates the top-level department for each business unit (idempotent, no table sync/drop).
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/seed-departments.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { Department } from '../models/Department.model';

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
  Department.initModel(sequelize);

  const departments = [
    { code: 'KS', name: 'Kurios Sat', description: 'Kurios Sat business unit' },
    { code: 'VM', name: 'Visamax Travels', description: 'Visamax Travels business unit' },
    { code: 'BM', name: 'Beadmax Design', description: 'Beadmax Design business unit' },
  ];

  console.log('\n🏢  Seeding business unit departments...\n');
  for (const dept of departments) {
    const [row, created] = await Department.findOrCreate({
      where: { code: dept.code },
      defaults: { ...dept, status: 'Active' } as any,
    });
    console.log(`   ${created ? '✨ Created' : '⏭️  Exists '} → ${dept.name} (${dept.code}) — id: ${row.id}`);
  }

  console.log('\n✅  Done.\n');
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Seeder failed:', err);
  process.exit(1);
});
