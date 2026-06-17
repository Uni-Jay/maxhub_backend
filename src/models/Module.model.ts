import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ModuleAttributes {
  id: bigint;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

interface ModuleCreationAttributes
  extends Optional<ModuleAttributes, 'id' | 'uuid' | 'isActive' | 'isDefault' | 'displayOrder'> {}

export class AppModule extends Model<ModuleAttributes, ModuleCreationAttributes> implements ModuleAttributes {
  public id!: bigint;
  public uuid!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public icon?: string;
  public isActive!: boolean;
  public isDefault!: boolean;
  public displayOrder!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AppModule {
    AppModule.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        name: { type: DataTypes.STRING(100), allowNull: false },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        icon: { type: DataTypes.STRING(50), allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        displayOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
      },
      {
        sequelize,
        tableName: 'app_modules',
        timestamps: true,
        indexes: [{ fields: ['code'], unique: true }],
      }
    );
    return AppModule;
  }
}
