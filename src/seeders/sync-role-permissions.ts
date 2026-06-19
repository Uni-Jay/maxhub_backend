/**
 * MaxHub ERP — Role-permission reconciliation
 *
 * seed.ts's role-permission step is additive only (bulkCreate with
 * ignoreDuplicates) — it inserts grants newly added to RolesConfig.ts but
 * never removes grants that were taken away. Every time a permission is
 * removed from a role in RolesConfig.ts, the stale DB row keeps the old
 * access working until this script (or a full reseed + manual cleanup) runs.
 *
 * This does a full reconciliation: for every role, the DB's RolePermission
 * rows are made to exactly match ROLE_PERMISSIONS in RolesConfig.ts —
 * inserting what's missing, deleting what's no longer granted.
 *
 * Run after every RolesConfig.ts edit:
 * npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/sync-role-permissions.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize, Op } from 'sequelize';
import { Role } from '../models/Role.model';
import { Permission } from '../models/Permission.model';
import { RolePermission } from '../models/RolePermission.model';
import { ROLE_PERMISSIONS, RoleCode } from '../config/RolesConfig';
import { PermissionCode } from '../config/PermissionCodes';

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
  Role.initModel(sequelize);
  Permission.initModel(sequelize);
  RolePermission.initModel(sequelize);

  // Seed any PermissionCode values added to PermissionCodes.ts but never inserted
  // into the permissions table — RolePermission rows can't reference a code that
  // doesn't exist as a Permission row yet, so this must run before reconciling grants.
  console.log('🔐  Ensuring all PermissionCode values exist as Permission rows...\n');
  const parsePermissionCode = (code: string) => {
    const parts = code.split('.');
    const scope = parts[parts.length - 1];
    const action = parts[parts.length - 2];
    const module = parts[0];
    const resource = parts.slice(1, parts.length - 2).join('.');
    return { module, resource, action, scope };
  };
  const toTitleCase = (str: string) => str.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const makePermissionName = (code: string) => {
    const { module, resource, action, scope } = parsePermissionCode(code);
    const scopeLabel = scope === 'own_department' ? 'Own Dept' : scope === 'own_warehouse' ? 'Own Warehouse' : scope === 'own' ? 'Own' : 'All';
    return `${toTitleCase(module)} › ${toTitleCase(resource)} › ${toTitleCase(action)} [${scopeLabel}]`;
  };

  const allCodes = Object.values(PermissionCode);
  const permRows = allCodes.map((code) => {
    const { module, resource, action, scope } = parsePermissionCode(code);
    return { code, name: makePermissionName(code), description: `${toTitleCase(action)} ${toTitleCase(resource)} (${scope})`, module, resource, action, scope, isActive: true };
  });
  await Permission.bulkCreate(permRows as any, { ignoreDuplicates: true });
  console.log(`✅  Permissions table has all ${allCodes.length} current codes\n`);

  const roles = await Role.findAll();
  const roleIdByCode = new Map<string, bigint>(roles.map((r: any) => [r.code, r.id]));

  const permissions = await Permission.findAll();
  const permIdByCode = new Map<string, bigint>(permissions.map((p: any) => [p.code, p.id]));

  let totalInserted = 0;
  let totalRemoved = 0;

  for (const [roleCode, desiredCodes] of Object.entries(ROLE_PERMISSIONS) as [RoleCode, PermissionCode[]][]) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) {
      console.warn(`⚠️  Role not found in DB: ${roleCode}`);
      continue;
    }

    const desiredPermIds = new Set<bigint>();
    for (const code of desiredCodes) {
      const permId = permIdByCode.get(code);
      if (!permId) {
        console.warn(`⚠️  Permission not found in DB: ${code} (role ${roleCode})`);
        continue;
      }
      desiredPermIds.add(permId);
    }

    const existing = await RolePermission.findAll({ where: { roleId }, attributes: ['id', 'permissionId'] });
    const existingPermIds = new Set<bigint>(existing.map((rp: any) => rp.permissionId));

    const toInsert = [...desiredPermIds].filter((id) => !existingPermIds.has(id));
    const toRemove = existing.filter((rp: any) => !desiredPermIds.has(rp.permissionId));

    if (toInsert.length) {
      await RolePermission.bulkCreate(
        toInsert.map((permissionId) => ({ roleId, permissionId })) as any,
        { ignoreDuplicates: true }
      );
      totalInserted += toInsert.length;
    }

    if (toRemove.length) {
      await RolePermission.destroy({ where: { id: { [Op.in]: toRemove.map((rp: any) => rp.id) } }, force: true });
      totalRemoved += toRemove.length;
    }

    console.log(`   ${roleCode}: +${toInsert.length} -${toRemove.length} (now ${desiredPermIds.size} permissions)`);
  }

  console.log(`\n✅  Reconciled. Inserted ${totalInserted}, removed ${totalRemoved} role-permission rows.\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Sync failed:', err);
  process.exit(1);
});
