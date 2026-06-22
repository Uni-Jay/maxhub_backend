/**
 * Backfills a Staff row for every demo/admin User account that has none.
 *
 * Every seeded demo account (superadmin through receptionist) had a User +
 * role assignment but no linked Staff row, so anything keyed off
 * Staff.userId — leave applications, attendance, payroll — failed with
 * "No staff record found for this account" for literally every demo login.
 * Idempotent: skips any userId that already has a Staff row.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/seeders/backfill-demo-staff.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.model';
import { Staff } from '../models/Staff.model';
import { Department } from '../models/Department.model';

const PERSONAS: Record<string, { position: string; employeeId: string }> = {
  'superadmin@maxhub.com':   { position: 'CEO',                employeeId: 'DEMO-SUPERADMIN' },
  'admin@maxhub.com':        { position: 'Head of Admin',       employeeId: 'DEMO-ADMIN' },
  'hr@maxhub.com':           { position: 'HR Manager',          employeeId: 'DEMO-HR' },
  'hod@maxhub.com':          { position: 'Head of Department',  employeeId: 'DEMO-HOD' },
  'staff@maxhub.com':        { position: 'General Staff',       employeeId: 'DEMO-STAFF' },
  'accountant@maxhub.com':   { position: 'Accountant',          employeeId: 'DEMO-ACCOUNTANT' },
  'instructor@maxhub.com':   { position: 'Instructor',          employeeId: 'DEMO-INSTRUCTOR' },
  'receptionist@maxhub.com': { position: 'Receptionist',         employeeId: 'DEMO-RECEPTIONIST' },
};

async function main() {
  const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });

  User.initModel(sequelize);
  Staff.initModel(sequelize);
  Department.initModel(sequelize);

  const department = await Department.findOne({ order: [['id', 'ASC']] });
  if (!department) {
    console.log('No department exists yet — run seed-departments.ts first. Aborting.');
    await sequelize.close();
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const [email, persona] of Object.entries(PERSONAS)) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`⏭️  No User found for ${email}, skipping`);
      continue;
    }
    const existing = await Staff.findOne({ where: { userId: (user as any).id } });
    if (existing) {
      skipped++;
      continue;
    }
    await Staff.create({
      uuid: uuidv4(),
      userId: (user as any).id,
      employeeId: persona.employeeId,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      email: (user as any).email,
      phone: '+2348000000000',
      dateOfBirth: new Date('1990-01-01'),
      departmentId: (department as any).id,
      joiningDate: new Date(),
      status: 'Active',
      position: persona.position,
    } as any);
    created++;
    console.log(`✅ Created Staff for ${email} (position: ${persona.position})`);
  }

  console.log(`\nDone. ${created} created, ${skipped} already had a Staff row.`);
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
