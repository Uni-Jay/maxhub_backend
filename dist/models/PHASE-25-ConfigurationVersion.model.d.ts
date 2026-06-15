import { Model, Optional } from 'sequelize';
interface PHASE25_ConfigurationVersionAttributes {
    id: number;
    organizationId: number;
    configType: string;
    versionNumber: number;
    configSnapshot: any;
    description: string;
    createdBy: number;
    isActive: boolean;
    rolledBackFrom: number;
    rolledBackTo: number;
    createdAt: Date;
}
interface PHASE25_ConfigurationVersionCreationAttributes extends Optional<PHASE25_ConfigurationVersionAttributes, 'id' | 'createdAt'> {
}
declare class PHASE25_ConfigurationVersion extends Model<PHASE25_ConfigurationVersionAttributes, PHASE25_ConfigurationVersionCreationAttributes> implements PHASE25_ConfigurationVersionAttributes {
    id: number;
    organizationId: number;
    configType: string;
    versionNumber: number;
    configSnapshot: any;
    description: string;
    createdBy: number;
    isActive: boolean;
    rolledBackFrom: number;
    rolledBackTo: number;
    readonly createdAt: Date;
}
export default PHASE25_ConfigurationVersion;
//# sourceMappingURL=PHASE-25-ConfigurationVersion.model.d.ts.map