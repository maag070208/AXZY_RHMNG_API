import { prismaClient } from "@src/core/config/database";

export const createIncident = async (data: {
    guardId: number;
    title: string;
    category: string;
    description?: string;
    media?: any;
}) => {
    return prismaClient.incident.create({
        data: {
            guardId: data.guardId,
            title: data.title,
            category: data.category,
            description: data.description,
            media: data.media
        }
    });
};

export const getIncidentsByGuard = async (guardId: number) => {
    return prismaClient.incident.findMany({
        where: { guardId },
        orderBy: { createdAt: 'desc' }
    });
};

export const getIncidents = async (filters: {
    startDate?: Date;
    endDate?: Date;
    guardId?: number;
    category?: string;
    title?: string;
}) => {
    const whereClause: any = {};

    if (filters.startDate && filters.endDate) {
        whereClause.createdAt = {
            gte: filters.startDate,
            lte: filters.endDate
        };
    } else if (filters.startDate) {
        whereClause.createdAt = { gte: filters.startDate };
    }

    if (filters.guardId) whereClause.guardId = filters.guardId;
    if (filters.category) whereClause.category = filters.category;
    if (filters.title) whereClause.title = { contains: filters.title, mode: 'insensitive' };

    return prismaClient.incident.findMany({
        where: whereClause,
        include: { 
            guard: true,
            resolvedBy: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const resolveIncident = async (id: number, userId: number) => {
    return prismaClient.incident.update({
        where: { id },
        data: {
            status: 'ATTENDED',
            resolvedAt: new Date(),
            resolvedById: userId
        },
        include: {
            guard: true,
            resolvedBy: true
        }
    });
};

export const getPendingIncidentsCount = async () => {
    return prismaClient.incident.count({
        where: {
            status: 'PENDING'
        }
    });
};
