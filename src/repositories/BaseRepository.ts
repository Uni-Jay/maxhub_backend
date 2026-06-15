import { FindOptions, FindAttributeOptions, CountOptions, Sequelize } from 'sequelize';

/**
 * Base Repository class for common CRUD operations
 * Provides generic methods for all models with filtering, pagination, and soft delete support
 */
export abstract class BaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  /**
   * Find all records with filtering, pagination, and sorting
   */
  async findAll(
    options?: {
      where?: any;
      attributes?: FindAttributeOptions;
      include?: any[];
      order?: any[][];
      limit?: number;
      offset?: number;
      paranoid?: boolean;
    }
  ): Promise<T[]> {
    return this.model.findAll({
      ...options,
      paranoid: options?.paranoid !== false,
    });
  }

  /**
   * Find paginated records
   */
  async findPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: any,
    order?: any[][],
    include?: any[]
  ): Promise<{ rows: T[]; count: number; total: number; pages: number }> {
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

  /**
   * Find by primary key
   */
  async findById(id: bigint | number, include?: any[]): Promise<T | null> {
    return this.model.findByPk(id, {
      include,
      paranoid: true,
    });
  }

  /**
   * Find by UUID
   */
  async findByUuid(uuid: string, include?: any[]): Promise<T | null> {
    return this.model.findOne({
      where: { uuid },
      include,
      paranoid: true,
    });
  }

  /**
   * Find one record by conditions
   */
  async findOne(where: any, include?: any[]): Promise<T | null> {
    return this.model.findOne({
      where,
      include,
      paranoid: true,
    });
  }

  /**
   * Create new record
   */
  async create(data: any): Promise<T> {
    return this.model.create(data);
  }

  /**
   * Create multiple records
   */
  async createMany(data: any[]): Promise<T[]> {
    return this.model.bulkCreate(data);
  }

  /**
   * Update record
   */
  async update(data: any, where: any): Promise<[number, T[]]> {
    return this.model.update(data, {
      where,
      returning: true,
      paranoid: true,
    });
  }

  /**
   * Update by ID
   */
  async updateById(id: bigint | number, data: any): Promise<T | null> {
    await this.model.update(data, {
      where: { id },
      paranoid: true,
    });
    return this.findById(id);
  }

  /**
   * Delete (soft delete)
   */
  async delete(where: any): Promise<number> {
    return this.model.destroy({
      where,
      paranoid: true,
    });
  }

  /**
   * Delete by ID (soft delete)
   */
  async deleteById(id: bigint | number): Promise<number> {
    return this.model.destroy({
      where: { id },
      paranoid: true,
    });
  }

  /**
   * Permanently delete
   */
  async hardDelete(where: any): Promise<number> {
    return this.model.destroy({
      where,
      force: true,
    });
  }

  /**
   * Restore soft-deleted record
   */
  async restore(where: any): Promise<number> {
    return this.model.restore({ where });
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    return this.model.count({
      where: where || {},
      paranoid: true,
    });
  }

  /**
   * Check existence
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Get aggregated data
   */
  async aggregate(attribute: string, fn: string, where?: any): Promise<any> {
    return this.model.aggregate(attribute, fn, {
      where: where || {},
      paranoid: true,
    });
  }

  /**
   * Bulk update with transaction support
   */
  async bulkUpdate(updates: Array<{ where: any; data: any }>): Promise<void> {
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Execute raw query
   */
  async raw(query: string, params?: any[]): Promise<any> {
    const sequelize = this.model.sequelize;
    return sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT,
    });
  }
}

/**
 * Example implementation for specific repository
 */
export class UserRepository extends BaseRepository<any> {
  constructor(userModel: any) {
    super(userModel);
  }

  /**
   * Find by email
   */
  async findByEmail(email: string): Promise<any | null> {
    return this.findOne({ email });
  }

  /**
   * Find active users
   */
  async findActive(include?: any[]): Promise<any[]> {
    return this.findAll({
      where: { status: 'Active' },
      include,
    });
  }

  /**
   * Get user with all permissions and roles
   */
  async findWithPermissions(userId: bigint): Promise<any | null> {
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
