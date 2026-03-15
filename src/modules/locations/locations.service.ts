import { prismaClient } from "@src/core/config/database"; // Consistent with other modules
import { ITDataTableFetchParams, ITDataTableResponse } from "@src/core/dto/datatable.dto";
import { getPrismaPaginationParams } from "@src/core/utils/prisma-pagination.utils";

const prisma = prismaClient;

export const getDataTableLocations = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<any>> => {
  const prismaParams = getPrismaPaginationParams(params);

  const [rows, total] = await Promise.all([
    prisma.location.findMany({
      ...prismaParams,
      where: {
        ...prismaParams.where,
        softDelete: false,
      }
    }),
    prisma.location.count({
      where: {
        ...prismaParams.where,
        softDelete: false,
      }
    })
  ]);

  return { rows, total };
};

export const getAllLocations = async () => {
  return await prisma.location.findMany({
    where: { softDelete: false },
    orderBy: { name: "asc" },
    

  });
};

export const createLocation = async (data: {
  aisle: string;
  spot: string;
  number: string;
  name?: string;
}) => {
  const name = data.name || `${data.aisle}-${data.spot}-${data.number}`;
  return await prisma.location.create({
    data: {
      aisle: data.aisle,
      spot: data.spot,
      number: data.number,
      name,
    },
  });
};

export const updateLocation = async (id: number, data: { aisle: string; spot: string; number: string; name: string }) => {
    return await prisma.location.update({
        where: { id },
        data
    });
};

export const deleteLocation = async (id: number) => {
    const location = await prisma.location.findUnique({
        where: { id },
    });

    if (!location) throw new Error("Location not found");

    // 1. Remove from any Recurring configurations
    // First find all recurring locations linked to this location
    const recurringLocs = await prisma.recurringLocation.findMany({
        where: { locationId: id }
    });

    for (const loc of recurringLocs) {
        // Delete all tasks associated with this recurring location
        await prisma.recurringTask.deleteMany({
            where: { recurringLocationId: loc.id }
        });
    }

    // Now delete the recurring locations themselves
    await prisma.recurringLocation.deleteMany({
        where: { locationId: id }
    });

    // 2. Soft delete the actual location
    return await prisma.location.update({
        where: { id },
        data: { softDelete: true, active: false },
    });
};

export const getAvailableLocation = async () => {
    // Return all active zones (shared logic)
  return await prisma.location.findFirst({
    where: { active: true, softDelete: false },
  });
};
