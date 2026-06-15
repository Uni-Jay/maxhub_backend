"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async findAll(options) {
        return this.model.findAll({
            ...options,
            paranoid: options?.paranoid !== false,
        });
    }
    async findPaginated(page = 1, limit = 10, filters, order, include) {
        const offset = (page - 1) * limit;
        const { count, rows } = await this.model.findAndCountAll({
            where: filters || {},
            limit,
            offset,
            order: order || [['createdAt', 'DESC']],
            include,
            paranoid: true,
        });
        return {
            rows,
            count: rows.length,
            total: count,
            pages: Math.ceil(count / limit),
        };
    }
    async findById(id, include) {
        return this.model.findByPk(id, {
            include,
            paranoid: true,
        });
    }
    async findByUuid(uuid, include) {
        return this.model.findOne({
            where: { uuid },
            include,
            paranoid: true,
        });
    }
    async findOne(where, include) {
        return this.model.findOne({
            where,
            include,
            paranoid: true,
        });
    }
    async create(data) {
        return this.model.create(data);
    }
    async createMany(data) {
        return this.model.bulkCreate(data);
    }
    async update(data, where) {
        return this.model.update(data, {
            where,
            returning: true,
            paranoid: true,
        });
    }
    async updateById(id, data) {
        await this.model.update(data, {
            where: { id },
            paranoid: true,
        });
        return this.findById(id);
    }
    async delete(where) {
        return this.model.destroy({
            where,
            paranoid: true,
        });
    }
    async deleteById(id) {
        return this.model.destroy({
            where: { id },
            paranoid: true,
        });
    }
    async hardDelete(where) {
        return this.model.destroy({
            where,
            force: true,
        });
    }
    async restore(where) {
        return this.model.restore({ where });
    }
    async count(where) {
        return this.model.count({
            where: where || {},
            paranoid: true,
        });
    }
    async exists(where) {
        const count = await this.count(where);
        return count > 0;
    }
    async aggregate(attribute, fn, where) {
        return this.model.aggregate(attribute, fn, {
            where: where || {},
            paranoid: true,
        });
    }
    async bulkUpdate(updates) {
        const sequelize = this.model.sequelize;
        const transaction = await sequelize.transaction();
        try {
            for (const update of updates) {
                await this.model.update(update.data, {
                    where: update.where,
                    transaction,
                });
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async raw(query, params) {
        const sequelize = this.model.sequelize;
        return sequelize.query(query, {
            replacements: params,
            type: sequelize.QueryTypes.SELECT,
        });
    }
}
exports.BaseRepository = BaseRepository;
class UserRepository extends BaseRepository {
    constructor(userModel) {
        super(userModel);
    }
    async findByEmail(email) {
        return this.findOne({ email });
    }
    async findActive(include) {
        return this.findAll({
            where: { status: 'Active' },
            include,
        });
    }
    async findWithPermissions(userId) {
        return this.findById(userId, [
            {
                association: 'roles',
                attributes: ['id', 'code', 'name'],
                through: { attributes: [] },
            },
            {
                association: 'permissions',
                attributes: ['id', 'code', 'module', 'resource', 'action', 'scope'],
                through: { attributes: [] },
            },
        ]);
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=BaseRepository.js.map