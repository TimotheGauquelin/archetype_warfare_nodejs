import { Model, Transaction } from 'sequelize';
import { Role } from '../models/RoleModel';
import { Type } from '../models/TypeModel';
import { SummonMechanic } from '../models/SummonMechanicModel';

declare module 'sequelize' {
    interface Model {
        setRoles?(roles: Role[] | number[], options?: { transaction?: Transaction }): Promise<void>;
        addRoles?(roles: Role[] | number[], options?: { transaction?: Transaction }): Promise<void>;
        hasRole?(role: Role | number): Promise<boolean>;
        addRole?(role: Role | number, options?: { transaction?: Transaction }): Promise<void>;
        setTypes?(types: Type[] | number[], options?: { transaction?: Transaction }): Promise<void>;
        setSummon_mechanics?(summonMechanics: SummonMechanic[] | number[], options?: { transaction?: Transaction }): Promise<void>;
    }
}
