import { ITDataTableFetchParams } from "../dto/datatable.dto";

/**
 * Converts ITDataTableFetchParams into Prisma query options.
 * Handles pagination (skip/take), sorting (orderBy), and filtering (where).
 */
export function getPrismaPaginationParams(params: ITDataTableFetchParams) {
  const { page, limit, filters, sort } = params;

  // Pagination
  const take = Number(limit) || 10;
  const skip = (Math.max(1, Number(page)) - 1) * take;

  // Sorting
  const orderBy = sort?.key
    ? { [sort.key]: sort.direction || "asc" }
    : { id: "desc" as const }; // Default sort

  // Filtering
  const where: any = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      // String filtering: contains + insensitive
      if (typeof value === "string") {
        where[key] = {
          contains: value,
          mode: "insensitive",
        };
      } 
      // Boolean and Number: exact match
      else {
        where[key] = value;
      }
    });
  }

  return {
    skip,
    take,
    where,
    orderBy,
  };
}
