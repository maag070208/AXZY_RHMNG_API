import { prismaClient } from "@src/core/config/database";
import { ITDataTableFetchParams, ITDataTableResponse } from "@src/core/dto/datatable.dto";
import { getPrismaPaginationParams } from "@src/core/utils/prisma-pagination.utils";

export const getUsers = async (search?: string) => {
  if (!search) {
    return prismaClient.user.findMany({
        where: { softDelete: false },
        orderBy: { name: 'asc' },
        include: { schedule: true }
    });
  }

  return prismaClient.user.findMany({
    where: {
      softDelete: false,
      OR: [
          { name: { contains: search } }, 
          { lastName: { contains: search } },
          { username: { contains: search } }
      ]
    },
    orderBy: { name: 'asc' },
    include: { schedule: true }
  });
};

export const getDataTableUsers = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<any>> => {
  const prismaParams = getPrismaPaginationParams(params);

  const [rows, total] = await Promise.all([
    prismaClient.user.findMany({
      ...prismaParams,
      where: {
        ...prismaParams.where,
        softDelete: false, // Maintain business logic
      },
      include: { schedule: true }
    }),
    prismaClient.user.count({ 
      where: {
        ...prismaParams.where,
        softDelete: false,
      }
    })
  ]);

  return { rows, total };
};

export const getUserByUsername = async (username: string) => {
  return prismaClient.user.findFirst({
    where: {
      username,
    },
    include: {
      schedule: true
    }
  });
};

export const addUser = async (data: any) => {
  // Auto-Assign Recurring Configs if Guard
  if (data.role === 'GUARD' || data.role === 'SHIFT_GUARD' || data.role === 'MANTENIMIENTO') {
      const allDirectives = await prismaClient.recurringConfiguration.findMany({
          where: { active: true },
          select: { id: true }
      });
      
      const connectIds = allDirectives.map(d => ({ id: d.id }));
      
      if (connectIds.length > 0) {
          data.recurringConfigurations = {
              connect: connectIds
          };
      }
  }

  return prismaClient.user.create({
    data,
  });
};

export const updateUser = async (id: number, data: any) => {
  return prismaClient.user.update({
    where: {
      id,
    },
    data,
  });
};

export const getUserById = async (id: number) => {
  return prismaClient.user.findUnique({
    where: {
      id,
    },
  });
};


export const getLoggedInGuards = async (excludeUserId: number) => {
  return prismaClient.user.findMany({
    where: {
      role: {
        in: ['GUARD', 'SHIFT_GUARD', 'MANTENIMIENTO'],
      },
      isLoggedIn: true,
      id: {
        not: excludeUserId,
      },
    },
  });
};

export const deleteUser = async (id: number) => {
  return prismaClient.user.delete({
    where: { id }
  });
};
