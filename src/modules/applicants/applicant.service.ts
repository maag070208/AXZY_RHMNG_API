import { prismaClient } from "@src/core/config/database";

export const getApplicants = async (vacancyId?: number) => {
  return prismaClient.applicant.findMany({
    where: vacancyId ? { vacancyId } : undefined,
    include: {
      vacancy: true,
      interviews: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getApplicantById = async (id: number) => {
  return prismaClient.applicant.findUnique({
    where: { id },
    include: {
      vacancy: true,
      documents: true,
      interviews: true,
    },
  });
};

export const createApplicant = async (data: any) => {
  return prismaClient.applicant.create({
    data,
  });
};

export const updateApplicant = async (id: number, data: any) => {
  return prismaClient.applicant.update({
    where: { id },
    data,
  });
};
