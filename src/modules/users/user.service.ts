import { prismaClient } from "@src/core/config/database";

export const getUsers = async (search?: string) => {
  if (!search) {
    return prismaClient.user.findMany({
        orderBy: { name: 'asc' }
    });
  }

  return prismaClient.user.findMany({
    where: {
      OR: [
          { name: { contains: search } }, 
          { lastName: { contains: search } },
          { username: { contains: search } }
      ]

    },
    orderBy: { name: 'asc' }
  });
};

export const getUserByUsername = async (username: string) => {
  return prismaClient.user.findFirst({
    where: {
      username,
    },
  });
};

export const addUser = async (data: any) => {
  // Auto-Assign Recurring Configs if Guard
  if (data.role === 'GUARD' || data.role === 'SHIFT_GUARD') {
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
        in: ['GUARD', 'SHIFT_GUARD'],
      },
      isLoggedIn: true,
      id: {
        not: excludeUserId,
      },
    },
  });
};
