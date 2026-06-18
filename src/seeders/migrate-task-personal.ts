/**
 * MaxHub ERP — Personal tasks + project comments schema migration
 * - Relaxes tasks.projectId to nullable (null = personal task, not tied to a project).
 * - Creates the project_comment table (brand new — was never registered/synced before).
 * - Relaxes project_comment.taskId / project_comment.projectId to nullable.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-task-personal.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { Task } from '../models/Task.model';
import { ProjectComment } from '../models/ProjectComment.model';

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

  console.log('\n🔄  Relaxing tasks.projectId to nullable...\n');
  await sequelize.query('ALTER TABLE tasks ALTER COLUMN "projectId" DROP NOT NULL');
  console.log('✅  tasks.projectId is now nullable\n');

  console.log('🔄  Creating project_comment table...\n');
  Task.initModel(sequelize);
  ProjectComment.initModel(sequelize);
  await sequelize.sync();
  console.log('✅  project_comment table ready\n');

  console.log('🔄  Relaxing project_comment.taskId / projectId to nullable...\n');
  await sequelize.query('ALTER TABLE project_comment ALTER COLUMN "taskId" DROP NOT NULL');
  await sequelize.query('ALTER TABLE project_comment ALTER COLUMN "projectId" DROP NOT NULL');
  console.log('✅  project_comment columns are now nullable\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
