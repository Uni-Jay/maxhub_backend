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
    console.log(`✅ Removed ${email} (user#${(user as any).id}${staff ? `, staff#${(staff as any).id}` : ''}, ${roles.length} role assignment(s) cleared)`);
  }

  console.log('\nDone.');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
