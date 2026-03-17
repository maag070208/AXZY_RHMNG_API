import { prismaClient } from "@src/core/config/database";

export const getVacancies = async (status?: any) => {
  return prismaClient.vacancy.findMany({
    where: status ? { status } : undefined,
    include: {
      slots: {
        include: {
          _count: { select: { applicants: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getVacancyById = async (id: number) => {
  return prismaClient.vacancy.findUnique({
    where: { id },
    include: {
      slots: {
        include: {
          _count: { select: { applicants: true } }
        }
      },
      interviews: true,
      applicants: true
    }
  });
};

export const getVacancyByQrToken = async (qrToken: string) => {
  return prismaClient.vacancy.findUnique({
    where: { qrToken },
    include: {
      slots: {
        include: {
          _count: { select: { applicants: true } }
        }
      },
      _count: {
        select: { applicants: true }
      }
    }
  });
};

export const createVacancy = async (data: any) => {
  return prismaClient.vacancy.create({
    data,
  });
};

export const updateVacancy = async (id: number, data: any) => {
  return prismaClient.vacancy.update({
    where: { id },
    data,
  });
};
export const deleteVacancy = async (id: number) => {
  return prismaClient.$transaction(async (tx) => {
    // 1. Delete interviews related to the vacancy
    await tx.interview.deleteMany({ where: { vacancyId: id } });
    
    // 2. Delete applicant documents related to applicants of this vacancy
    await tx.applicantDocument.deleteMany({
      where: { applicant: { vacancyId: id } }
    });

    // 3. Delete applicants related to the vacancy
    await tx.applicant.deleteMany({ where: { vacancyId: id } });

    // 4. Delete slots related to the vacancy
    await tx.vacancySlot.deleteMany({ where: { vacancyId: id } });

    // 5. Finally, delete the vacancy
    return tx.vacancy.delete({
      where: { id },
    });
  });
};
