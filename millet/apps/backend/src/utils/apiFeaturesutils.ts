import { Prisma } from "@repo/db/src/index"

class ApiFeatures<T extends { findMany: (args: any) => Promise<any[]> }> {
  public query: T;
  public queryOptions: {
    where?: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
    select?: Record<string, boolean>;
  } = {};
  private queryString: Record<string, any>;

  constructor(query: T, queryString: Record<string, any>) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering for price ranges (e.g., ?price[gte]=100&price[lte]=500)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    // In Prisma, we handle number conversion and relations differently
    const whereClause: Record<string, any> = {};
    for (const key in queryObj) {
        if (key === 'price' && typeof queryObj[key] === 'object') {
            whereClause[key] = {};
            for (const operator in queryObj[key]) {
                whereClause[key][operator] = Number(queryObj[key][operator]);
            }
        } else if (key === 'isFeatured') {
             whereClause[key] = queryObj[key] === 'true';
        }
        else {
            whereClause[key] = queryObj[key];
        }
    }
    
    this.queryOptions.where = { ...this.queryOptions.where, ...whereClause };
    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // Example: ?sort=price,-createdAt -> orderBy: [{ price: 'asc' }, { createdAt: 'desc' }]
      this.queryOptions.orderBy = sortBy.split(' ').map((field: string) => {
        if (field.startsWith('-')) {
          return { [field.substring(1)]: 'desc' };
        }
        return { [field]: 'asc' };
      });
    } else {
      this.queryOptions.orderBy = { createdAt: 'desc' };
    }
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',');
      this.queryOptions.select = fields.reduce((acc: Record<string, boolean>, field: string) => {
        acc[field.trim()] = true;
        return acc;
      }, {});
    }
    return this;
  }

  paginate(): this {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.queryOptions.skip = skip;
    this.queryOptions.take = limit;
    return this;
  }

  async execute() {
    return this.query.findMany(this.queryOptions);
  }
}

export default ApiFeatures;