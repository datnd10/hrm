import { Repository, FindManyOptions } from 'typeorm';

export interface PaginateResult<T> {
    data: T[];
    total: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
}

export interface PaginateOptions {
    page: number;
    limit: number;
}

export async function paginate<T>(
    repository: Repository<T>,
    options: PaginateOptions,
    queryOptions?: FindManyOptions<T>,
): Promise<PaginateResult<T>> {
    const { page, limit } = options;

    // Tính toán số bản ghi bỏ qua (skip)
    const skip = (page - 1) * limit;

    // Lấy dữ liệu và tổng số bản ghi
    const [data, total] = await repository.findAndCount({
        skip,
        take: limit,
        ...queryOptions, // Bổ sung điều kiện query nếu có
    });

    return {
        data,
        total,
        currentPage: page,
        lastPage: Math.ceil(total / limit),
        perPage: limit,
    };
}
