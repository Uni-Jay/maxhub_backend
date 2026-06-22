/**
 * Removes the seeded demo/role-sample accounts now that real accounts
 * exist (joshua.ogiriosa@maxhubng.company, ademola.adenusi@maxhubng.company).
 *
 * Soft-deletes (User/Staff are both `paranoid: true` — sets deletedAt,
 * doesn't actually remove the row) rather than a hard delete, matching
 * how every other "Delete" action in this app already works: reversible,
 * and avoids touching historical records (messages sent, leave requests
 * approved, etc.) that reference these users by id elsewhere.
 *
 * UserRole assignments are hard-deleted — they're pure join-table rows
 * with no standalone meaning once the account is gone.
 *
 * Also mangles the User.email on each soft-deleted row. Postgres's unique
 * index on email doesn't care that a row is soft-deleted — it still
 * physically holds that value — so registering any *new* person (staff or
 * student) with one of these exact addresses later would pass every
 * application-level "does this already exist?" check (which correctly
 * excludes soft-deleted rows) and then fail at the database with a raw
 * unique-constraint violation, surfacing as a generic "Duplicate entry
 * detected" pointing at nothing visible. This happened live the first time
 * this script ran without the mangling step.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/remove-demo-accounts.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { User } from '../models/User.model';
import { Staff } from '../models/Staff.model';
import { UserRole } from '../models/UserRole.model';

const DEMO_EMAILS = [
  'superadmin@maxhub.com',
  'admin@maxhub.com',
  'hr@maxhub.com',
  'hod@maxhub.com',
  'staff@maxhub.com',
  'accountant@maxhub.com',
  'instructor@maxhub.com',
  'receptionist@maxhub.com',
  'student@maxhub.com',
];

async function main() {
  const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });

  User.initModel(sequelize);
  Staff.initModel(sequelize);
  UserRole.initModel(sequelize);

  for (const email of DEMO_EMAILS) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`⏭️  No account found for ${email}, skipping`);
      continue;
    }
    const staff = await Staff.findOne({ where: { userId: (user as any).id } });
    if (staff) await staff.destroy();
    const roles = await UserRole.findAll({ where: { userId: (user as any).id } });
    if (roles.length) await UserRole.destroy({ where: { userId: (user as any).id } });
    await user.destroy();
    await user.update({ email: `deleted_${email}` } as any);
    console.log(`✅ Removed ${email} (user#${(user as any).id}${staff ? `, staff#${(staff as any).id}` : ''}, ${roles.length} role assignment(s) cleared, email freed for reuse)`);
  }

  console.log('\nDone.');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
