import { prismaClient } from "@src/core/config/database";

export const getInterviews = async (vacancyId?: number, applicantId?: number) => {
  return prismaClient.interview.findMany({
    where: {
      ...(vacancyId && { vacancyId }),
      ...(applicantId && { applicantId }),
    },
    include: {
      vacancy: true,
      applicant: true,
      interviewer: {
        select: { id: true, name: true, lastName: true, username: true }
      }
    },
    orderBy: { scheduledAt: "asc" },
  });
};

export const getInterviewById = async (id: number) => {
  return prismaClient.interview.findUnique({
    where: { id },
    include: {
      vacancy: true,
      applicant: true,
      interviewer: {
        select: { id: true, name: true, lastName: true, username: true }
      }
    },
  });
};

export const createInterview = async (data: any) => {
  return prismaClient.interview.create({
    data,
  });
};

export const updateInterview = async (id: number, data: any) => {
  return prismaClient.interview.update({
    where: { id },
    data,
  });
};
