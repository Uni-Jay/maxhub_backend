"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Location extends sequelize_1.Model {
    static initModel(sequelize) {
        Location.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            code: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: true,
                allowNull: false,
                comment: 'Location code (HQ, NYC_OFFICE, etc.)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Location name',
            },
            address: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: false,
                comment: 'Street address',
            },
            city: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'City name',
            },
            state: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'State/Province',
            },
            country: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Country name',
            },
            postalCode: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
                comment: 'Postal/ZIP code',
            },
            latitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true,
                comment: 'Geographic latitude',
            },
            longitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true,
                comment: 'Geographic longitude',
            },
            timezone: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true,
                comment: 'Timezone (e.g., America/New_York)',
            },
            isHeadOffice: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether location is head office',
            },
            capacity: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Office capacity/seating',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Location status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'locations',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_locations_code',
                },
                {
                    fields: ['city'],
                    name: 'idx_locations_city',
                },
                {
                    fields: ['country'],
                    name: 'idx_locations_country',
                },
                {
                    fields: ['isHeadOffice'],
                    name: 'idx_locations_isHeadOffice',
                },
                {
                    fields: ['status'],
                    name: 'idx_locations_status',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_locations_uuid',
                },
            ],
            comment: 'Office/facility locations with geographic coordinates',
        });
        return Location;
    }
}
exports.Location = Location;
//# sourceMappingURL=Location.model.js.map