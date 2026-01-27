
import { PrismaClient } from '@prisma/client';
import { TResult } from '@src/core/dto/TResult';
const prisma = new PrismaClient();

export const startRound = async (guardId: number): Promise<TResult<any>> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 0. Get Guard info to know the Schedule
    const guard = await prisma.user.findUnique({
        where: { id: guardId }
    });

    if (!guard) {
        return { success: false, data: null, messages: ['Guardia no encontrado'] };
    }

    // Define filter for Schedule (if no schedule, match all? or match others with no schedule?)
    // Requirement: "Solo un guardia POR TURNO".
    // If scheduleId exists, check only that schedule.
    // If scheduleId is null, we might fallback to global or legacy check.
    // For now, if scheduleId is present, we enforce per-schedule.
    
    const scheduleFilter = guard.scheduleId 
        ? { scheduleId: guard.scheduleId } 
        : {}; // If no schedule, maybe check all? Or just legacy behavior (global).

    // 1. Check if there is ANY active round FOR THIS SCHEDULE
    const activeRound = await prisma.round.findFirst({
        where: {
            status: 'IN_PROGRESS',
            guard: {
                // If guard has schedule, match that. If not, this empty object effectively matches any? 
                // Wait, empty object in relation filter doesn't filter.
                // We want: if guard.scheduleId is set, match guards with same scheduleId.
                // If guard.scheduleId is null, maybe just check global? The user wants "Por Turno".
                // Let's rely on explicit IDs.
               ...(guard.scheduleId ? { scheduleId: guard.scheduleId } : {})
            }
        },
        include: { guard: true }
    });

    if (activeRound) {
        // Refine message to be clearer
        const scheduleName = activeRound.guard.scheduleId === guard.scheduleId ? "del mismo turno" : "";
        return {
            success: false,
            messages: [`Hay una ronda en curso por ${activeRound.guard.name} (${scheduleName || 'global'}). Solo una ronda permitida por turno.`],
            data: activeRound,
        };
    }

    // 2. Check if there is ANY completed round TODAY FOR THIS SCHEDULE
    const completedRoundToday = await prisma.round.findFirst({
      where: {
        status: 'COMPLETED',
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        guard: {
             ...(guard.scheduleId ? { scheduleId: guard.scheduleId } : {})
        }
      },
      include: { guard: true }
    });

    if (completedRoundToday) {
         return {
            success: false,
            messages: ['Ya se ha completado la ronda del día para este turno.'],
            data: completedRoundToday,
          };
    }

    const newRound = await prisma.round.create({
      data: {
        guardId,
        status: 'IN_PROGRESS',
        startTime: new Date(),
      },
      include: { guard: true }
    });

    return {
      success: true,
      messages: ['Ronda iniciada correctamente'],
      data: newRound,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      messages: ['Error al iniciar la ronda: ' + error.message],
    };
  }
};

export const endRound = async (roundId: number): Promise<TResult<any>> => {
  try {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return { success: false, data: null, messages: ['Ronda no encontrada'] };
    }

    if (round.status === 'COMPLETED') {
        return { success: false, data: null, messages: ['Esta ronda ya ha finalizado'] };
    }

    const updatedRound = await prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });

    return {
      success: true,
      messages: ['Ronda finalizada correctamente'],
      data: updatedRound,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      messages: ['Error al finalizar la ronda: ' + error.message],
    };
  }
};

export const getCurrentRound = async (guardId: number): Promise<TResult<any>> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch the LATEST GLOBAL round for TODAY (Active OR Completed)
        const round = await prisma.round.findFirst({
            where: {
                startTime: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                guard: true
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        if (!round) {
            return { success: true, data: null, messages: ['No hay ronda activa hoy'] };
        }

        return { success: true, data: round, messages: [] };
    } catch (error: any) {
        return { success: false, data: null, messages: ['Error al obtener la ronda actual: ' + error.message] };
    }
};

export const getRounds = async (dateStr?: string, guardId?: number): Promise<TResult<any>> => {
    try {
        let dateFilter: any = {};
        if (dateStr) {
            const start = new Date(dateStr);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            dateFilter = {
                startTime: {
                    gte: start,
                    lt: end
                }
            };
        }

        const where: any = { ...dateFilter };
        if (guardId) {
            where.guardId = guardId;
        }

        const rounds = await prisma.round.findMany({
            where,
            include: {
                guard: {
                    select: { id: true, name: true, lastName: true }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return { success: true, data: rounds, messages: [] };

    } catch (error: any) {
        return { success: false, data: null, messages: ['Error al obtener rondas: ' + error.message] };
    }
};

export const getRoundDetail = async (roundId: number): Promise<TResult<any>> => {
    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: {
                guard: {
                    select: { id: true, name: true, lastName: true }
                }
            }
        });

        if (!round) {
            return { success: false, data: null, messages: ['Ronda no encontrada'] };
        }

        const start = round.startTime;
        const end = round.endTime || new Date();

        // 1. Fetch Scans (Kardex) in range
        const scans = await prisma.kardex.findMany({
            where: {
                timestamp: { gte: start, lte: end }
            },
            include: {
                location: true,
                user: { select: { id: true, name: true, lastName: true } },
                assignment: {
                    include: {
                        tasks: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        // 2. Fetch Incidents in range
        const incidents = await prisma.incident.findMany({
            where: {
                createdAt: { gte: start, lte: end }
            },
            include: {
                guard: { select: { id: true, name: true, lastName: true } } // Assuming relation is named 'guard' based on schema
            },
            orderBy: { createdAt: 'asc' }
        });

        // 3. Construct Timeline
        const timeline: any[] = [];

        // Add Start Event
        timeline.push({
            type: 'START',
            timestamp: round.startTime,
            description: 'Inicio de Ronda',
            guard: round.guard,
            data: round
        });

        // Add Scans
        scans.forEach(scan => {
            timeline.push({
                type: 'SCAN',
                timestamp: scan.timestamp,
                description: `Escaneo: ${scan.location.name}`,
                guard: scan.user,
                data: scan
            });
        });

        // Add Incidents
        incidents.forEach(inc => {
            timeline.push({
                type: 'INCIDENT',
                timestamp: inc.createdAt, 
                description: `Incidencia: ${inc.title} (${inc.category})`,
                guard: inc.guard, // Needs verifying schema relation name
                data: inc
            });
        });

        // Add End Event if completed
        if (round.endTime) {
            timeline.push({
                type: 'END',
                timestamp: round.endTime,
                description: 'Fin de Ronda',
                guard: round.guard, // Or whoever ended it? Round schema only has one guardId (initiator). 
                // Ideally we'd capture who ended it, but schema doesn't seem to have 'endedBy'. 
                // We'll assume the initiator for now or leaving guard undefined.
                data: round
            });
        }

        // Sort by timestamp
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return {
            success: true,
            data: {
                round,
                timeline
            },
            messages: []
        };

    } catch (error: any) {
        return { success: false, data: null, messages: ['Error al obtener detalle de ronda: ' + error.message] };
    }
};
