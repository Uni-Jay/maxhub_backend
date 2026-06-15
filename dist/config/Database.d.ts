import { Sequelize } from 'sequelize';
declare class DatabaseConfig {
    private static instance;
    static getInstance(): Sequelize;
    static testConnection(): Promise<void>;
    static closeConnection(): Promise<void>;
    static syncDatabase(force?: boolean): Promise<void>;
}
export default DatabaseConfig;
//# sourceMappingURL=Database.d.ts.map