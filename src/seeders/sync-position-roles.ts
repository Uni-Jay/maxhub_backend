/**
 * MaxHub ERP — sync existing staff roles to match their position
 *
 * POSITION_ROLE_MAP (backend/src/config/PositionRoleMap.ts) defines which
 * positions carry which RBAC role:
 *   Manager -> admin, Head of Admin -> admin, HR -> hr, HOD -> hod,
 *   Accountant/Administrative Staff/Staff -> staff (position only, no role).
 *
 * This is additive going forward (POST/PATCH /api/staff now auto-assign the
 * right role), but won't retroactively fix staff created before that change.
 * This script does that one-off backfill — idempotent, safe to re-run.
 * Skips Super Admins entirely so it can never demote one.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/sync-position-roles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { Staff } from '../models/Staff.model';
import { User } from '../models/User.model';
import { Role } from '../models/Role.model';
import { UserRole } from '../models/UserRole.model';
import { POSITION_ROLE_MAP } from '../config/PositionRoleMap';

const CANONICAL_CODES = ['superadmin', 'admin', 'hr', 'hod', 'staff'];

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
  Staff.initModel(sequelize);
  User.initModel(sequelize);
  Role.initModel(sequelize);
  UserRole.initModel(sequelize);

  const roles = await Role.findAll();
  const roleByCode = new Map<string, any>(roles.map((r: any) => [r.code, r]));

  const allStaff = await Staff.findAll({ attributes: ['id', 'userId', 'position', 'firstName', 'lastName'] });
  console.log(`Checking ${allStaff.length} staff record(s)...\n`);

  let changed = 0;
  for (const s of allStaff as any[]) {
    const targetCode = s.position ? (POSITION_ROLE_MAP[String(s.position).trim().toLowerCase()] ?? 'staff') : 'staff';
    const userRoles = await UserRole.findAll({ where: { userId: s.userId } });
    const userRoleCodes = userRoles
      .map((ur: any) => roles.find((r: any) => String(r.id) === String(ur.roleId))?.code)
      .filter(Boolean);

    if (userRoleCodes.includes('superadmin')) continue; // never touch a Super Admin
    if (userRoleCodes.includes(targetCode)) continue; // already correct

    const targetRole = roleByCode.get(targetCode);
    if (!targetRole) {
      console.warn(`  ⚠️  Role code not found in DB: ${targetCode} (staff ${s.firstName} ${s.lastName})`);
      continue;
    }

    const toRemove = userRoles.filter((ur: any) => {
      const code = roles.find((r: any) => String(r.id) === String(ur.roleId))?.code;
      return code && CANONICAL_CODES.includes(code);
    });
    for (const ur of toRemove) await ur.destroy();
    await UserRole.create({ userId: s.userId, roleId: targetRole.id } as any);

    console.log(`  ✓ ${s.firstName} ${s.lastName} (${s.position || 'no position'}): -> ${targetCode}`);
    changed++;
  }

  console.log(`\n✅  Done. ${changed} staff member(s) had their role corrected.\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Sync failed:', err);
  process.exit(1);
});
