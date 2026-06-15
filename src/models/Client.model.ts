import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ClientAttributes {
  id: bigint;
  uuid: string;
  clientId: string; // e.g. CLT-0001
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationality?: string;
  dateOfBirth?: Date;
  passportUrl?: string;
  avatar?: string;
  departmentId?: bigint;
  assignedStaffId?: bigint;
  registrationDate: Date;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  notes?: string;
  createdByUserId: bigint;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ClientCreationAttributes
  extends Optional<
    ClientAttributes,
    | 'id'
    | 'uuid'
    | 'clientId'
    | 'alternatePhone'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'nationality'
    | 'dateOfBirth'
    | 'passportUrl'
    | 'avatar'
    | 'departmentId'
    | 'assignedStaffId'
    | 'notes'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class Client
  extends Model<ClientAttributes, ClientCreationAttributes>
  implements ClientAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare clientId: string;
  declare fullName: string;
  declare email: string;
  declare phone: string;
  declare alternatePhone?: string;
  declare address?: string;
  declare city?: string;
  declare state?: string;
  declare country?: string;
  declare nationality?: string;
  declare dateOfBirth?: Date;
  declare passportUrl?: string;
  declare avatar?: string;
  declare departmentId?: bigint;
  declare assignedStaffId?: bigint;
  declare registrationDate: Date;
  declare status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  declare notes?: string;
  declare createdByUserId: bigint;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    Client.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        clientId: { type: DataTypes.STRING(20), unique: true },
        fullName: { type: DataTypes.STRING(200), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(20), allowNull: false },
        alternatePhone: { type: DataTypes.STRING(20), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        state: { type: DataTypes.STRING(100), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true },
        nationality: { type: DataTypes.STRING(100), allowNull: true },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
        passportUrl: { type: DataTypes.STRING(500), allowNull: true },
        avatar: { type: DataTypes.STRING(500), allowNull: true },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        assignedStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        registrationDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Pending', 'Suspended'),
          defaultValue: 'Active',
        },
        notes: { type: DataTypes.TEXT, allowNull: true },
        createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      },
      {
        sequelize,
        modelName: 'Client',
        tableName: 'clients',
        paranoid: true,
        timestamps: true,
        hooks: {
          beforeCreate: async (client) => {
            if (!client.clientId) {
              const count = await Client.count();
              client.clientId = `CLT-${String(count + 1).padStart(4, '0')}`;
            }
          },
        },
      }
    );
  }
}

export default Client;
