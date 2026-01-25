import { prismaClient } from "@src/core/config/database";

export const getAllRecurringConfigurations = async () => {
    return prismaClient.recurringConfiguration.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            recurringLocations: {
                include: {
                    location: true,
                    tasks: true
                }
            },
            guards: true
        }
    });
};

export const getRecurringConfigById = async (id: number) => {
    return prismaClient.recurringConfiguration.findUnique({
        where: { id },
        include: {
            recurringLocations: {
                include: {
                    location: true,
                    tasks: true
                }
            }
        }
    });
};

interface ITaskCreate {
    description: string;
    reqPhoto: boolean;
}

interface ILocationCreate {
    locationId: number;
    tasks: ITaskCreate[];
}

export const createRecurringConfiguration = async (title: string, locations: ILocationCreate[]) => {
    // 1. Fetch all guards to auto-assign
    const guards = await prismaClient.user.findMany({
        where: {
            active: true,
            role: {
                in: ['GUARD', 'SHIFT_GUARD']
            }
        },
        select: { id: true }
    });

    const guardIds = guards.map(g => ({ id: g.id }));

    return prismaClient.recurringConfiguration.create({
        data: {
            title,
            active: true,
            guards: {
                connect: guardIds
            },
            recurringLocations: {
                create: locations.map(loc => ({
                    locationId: loc.locationId,
                    active: true,
                    tasks: {
                        create: loc.tasks
                    }
                }))
            }
        },
        include: {
            recurringLocations: {
                include: {
                    location: true,
                    tasks: true
                }
            },
            guards: true
        }
    });
};

export const toggleRecurringConfiguration = async (id: number, active: boolean) => {
    return prismaClient.recurringConfiguration.update({
        where: { id },
        data: { active }
    });
};

export const deleteRecurringConfiguration = async (id: number) => {
    // Cascading delete needs to be handled either by DB or Prisma
    // If not set in schema, we must delete children first.
    
    const config = await prismaClient.recurringConfiguration.findUnique({
        where: { id },
        include: { recurringLocations: { include: { tasks: true } } }
    });

    if (config) {
        for (const loc of config.recurringLocations) {
            await prismaClient.recurringTask.deleteMany({ where: { recurringLocationId: loc.id } });
            await prismaClient.recurringLocation.delete({ where: { id: loc.id } });
        }
        return prismaClient.recurringConfiguration.delete({ where: { id } });
    }
    return null;
};

export const assignConfigurationToGuards = async (configId: number, guardIds: number[]) => {
    // Reset existing assignments if needed or just add. 
    // Usually "set" (replace) is safer for this UI.
    return prismaClient.recurringConfiguration.update({
        where: { id: configId },
        data: {
            guards: {
                set: guardIds.map(id => ({ id }))
            }
        },
        include: { guards: true }
    });
};

export const updateRecurringConfiguration = async (id: number, title: string, locations: ILocationCreate[]) => {
    // Transaction to ensure atomicity
    return prismaClient.$transaction(async (prisma) => {
        // 1. Update basic info
        const updatedConfig = await prisma.recurringConfiguration.update({
            where: { id },
            data: { title }
        });

        // 2. Delete existing locations (and tasks via cascade usually, but manual here to be safe)
        // First get IDs to delete tasks? Prims schema doesn't show cascade explicitly on DB level maybe.
        // Let's find them first.
        const existingLocs = await prisma.recurringLocation.findMany({ where: { configurationId: id } });
        for (const loc of existingLocs) {
            await prisma.recurringTask.deleteMany({ where: { recurringLocationId: loc.id } });
        }
        await prisma.recurringLocation.deleteMany({ where: { configurationId: id } });

        // 3. Create new locations
        for (const loc of locations) {
             await prisma.recurringLocation.create({
                 data: {
                     configurationId: id,
                     locationId: loc.locationId,
                     active: true,
                     tasks: {
                         create: loc.tasks
                     }
                 }
             });
        }

        return prisma.recurringConfiguration.findUnique({
            where: { id },
             include: {
                recurringLocations: {
                    include: {
                        location: true,
                        tasks: true
                    }
                },
                guards: true
            }
        });
    });
};

export const getRecurringConfigurationsForUser = async (userId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const configs = await prismaClient.recurringConfiguration.findMany({
        where: {
            active: true,
            guards: {
                some: { id: userId }
            }
        },
        include: {
            recurringLocations: {
                include: {
                    location: true,
                    tasks: true
                }
            }
        }
    });

    // Check completion status for today
    const enrichedConfigs = await Promise.all(configs.map(async (config) => {
        const enrichedLocations = await Promise.all(config.recurringLocations.map(async (loc) => {
            // Check if there is a Kardex entry for this location today by this user (or generally completed if shared?)
            // Requirement: "Guard needs to report". Usually recurring implies checking if *this specific guard* or *any guard* checked it.
            // Assuming simplified "scanned today" logic.
            const scan = await prismaClient.kardex.findFirst({
                where: {
                    locationId: loc.locationId,
                    userId: userId, // CRITICAL: Check only for this user's scans
                    timestamp: {
                        gte: today
                    },
                    // Ensure it is a completed report (not a draft with empty notes)
                    notes: {
                        not: '' 
                    }
                }
            });
            
            return {
                ...loc,
                completed: !!scan,
                completedAt: scan?.timestamp
            };
        }));

        return {
            ...config,
            recurringLocations: enrichedLocations
        };
    }));

    console.log("DEBUG: Service - Enriched Configs:", JSON.stringify(enrichedConfigs.map(c => ({id: c.id, locs: c.recurringLocations.length})), null, 2));

    return enrichedConfigs;
};
