export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function getPagination(params: any): { limit: number; offset: number; page: number } {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 50;
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

export function buildPaginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
