"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sequelize_1 = require("sequelize");
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
    const sequelize = dbUrl
        ? new sequelize_1.Sequelize(dbUrl, {
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        })
        : new sequelize_1.Sequelize({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        });
    await sequelize.authenticate();
    console.log('\n🔄  Adding enrollments.total_fee...\n');
    await sequelize.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS total_fee DECIMAL(12,2);`);
    console.log('✅  enrollments.total_fee is live\n');
    const enrollmentsWithReceipts = await sequelize.query(`SELECT DISTINCT "enrollmentId" AS enrollment_id FROM fee_receipts`, { type: sequelize_1.QueryTypes.SELECT });
    for (const { enrollment_id } of enrollmentsWithReceipts) {
        const receipts = await sequelize.query(`SELECT "amountPaid" AS amount_paid, balance, "paymentDate" AS payment_date FROM fee_receipts
       WHERE "enrollmentId" = :enrollmentId ORDER BY "paymentDate" ASC, id ASC`, { type: sequelize_1.QueryTypes.SELECT, replacements: { enrollmentId: enrollment_id } });
        let cumulativePaid = 0;
        for (const r of receipts)
            cumulativePaid += Number(r.amount_paid);
        const latestBalance = Number(receipts[receipts.length - 1].balance);
        const totalFee = cumulativePaid + latestBalance;
        await sequelize.query(`UPDATE enrollments SET total_fee = :totalFee WHERE id = :id`, {
            replacements: { totalFee, id: enrollment_id },
        });
        console.log(`  enrollment ${enrollment_id}: total_fee = ${totalFee} (paid so far = ${cumulativePaid})`);
        let runningPaid = 0;
        for (const r of receipts) {
            runningPaid += Number(r.amount_paid);
            const correctedBalance = Math.max(totalFee - runningPaid, 0);
            await sequelize.query(`UPDATE fee_receipts SET balance = :balance WHERE "enrollmentId" = :enrollmentId AND "paymentDate" = :paymentDate`, { replacements: { balance: correctedBalance, enrollmentId: enrollment_id, paymentDate: r.payment_date } });
        }
    }
    console.log(`\n✅  Backfilled total_fee + corrected running balances for ${enrollmentsWithReceipts.length} enrollment(s)\n`);
    await sequelize.close();
    process.exit(0);
}
main().catch((err) => {
    console.error('\n❌  Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate-enrollment-total-fee.js.map