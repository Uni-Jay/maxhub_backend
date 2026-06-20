/**
 * One-off: the original temp password for a staff member was never
 * recoverable (it's hashed, not stored in plaintext) because the welcome
 * email failed to send at creation time (bad SMTP credentials, fixed
 * separately). This generates a fresh temp password, updates the user's
 * hash, and emails it via the same welcome template POST /api/staff uses.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/reset-and-email-temp-password.ts <email>
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { User } from '../models/User.model';
import { Staff } from '../models/Staff.model';
import { Department } from '../models/Department.model';
import PasswordService from '../services/PasswordService';
import { sendWelcomeEmail } from '../services/CommunicationService';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: ts-node reset-and-email-temp-password.ts <email>');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
  const sequelize = new Sequelize(dbUrl!, {
    dialect: 'postgres',
    logging: false,
    pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
    dialectOptions: { ssl: SSL_OPTIONS },
  });

  await sequelize.authenticate();
  User.initModel(sequelize);
  Staff.initModel(sequelize);
  Department.initModel(sequelize);

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  const staff = await Staff.findOne({ where: { email } });
  const dept = staff && (staff as any).departmentId ? await Department.findByPk((staff as any).departmentId, { attributes: ['name'] }) : null;

  const temporaryPassword = PasswordService.generateRandomPassword(12);
  const passwordHash = await PasswordService.hashPassword(temporaryPassword);
  await user.update({ passwordHash, mustChangePassword: true } as any);

  console.log(`✅  Password reset for ${email}`);
  console.log(`   New temp password: ${temporaryPassword}`);

  const sent = await sendWelcomeEmail({
    to: email,
    firstName: (user as any).firstName,
    lastName: (user as any).lastName,
    employeeId: (staff as any)?.employeeId || '—',
    temporaryPassword,
    position: (staff as any)?.position || undefined,
    department: (dept as any)?.name || undefined,
  });

  console.log(sent ? '✅  Welcome email sent' : '❌  Welcome email failed to send (check SMTP config)');

  await sequelize.close();
  process.exit(sent ? 0 : 1);
}

main().catch((err) => {
  console.error('\n❌  Failed:', err);
  process.exit(1);
});
