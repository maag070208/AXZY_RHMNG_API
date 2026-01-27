import { prismaClient } from "@src/core/config/database";

export const getSchedules = async () => {
    return prismaClient.schedule.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
    });
};

export const createSchedule = async (data: {
    name: string;
    startTime: string;
    endTime: string;
}) => {
    return prismaClient.schedule.create({
        data
    });
};

export const updateSchedule = async (id: number, data: {
    name?: string;
    startTime?: string;
    endTime?: string;
    active?: boolean;
}) => {
    return prismaClient.schedule.update({
        where: { id },
        data
    });
};

export const deleteSchedule = async (id: number) => {
    return prismaClient.schedule.update({
        where: { id },
        data: { active: false }
    });
};
