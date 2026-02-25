import { createTResult } from "@src/core/mappers/tresult.mapper";
import { Request, Response } from "express";
import * as maintenanceService from "./maintenance.service";

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { title, category, description, media } = req.body;
    // @ts-ignore
    const guardId = req.user?.id;

    if (!guardId) {
        return res.status(401).json(createTResult(null, ["Usuario no autenticado"]));
    }
    
    // Media is passed as an array of objects { type, url, key }
    const mediaFiles = media || [];

    const result = await maintenanceService.createMaintenance({
      guardId: Number(guardId),
      title,
      category,
      description,
      media: mediaFiles.length > 0 ? mediaFiles : undefined,
    });

    return res.status(201).json(createTResult(result));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getMaintenances = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, guardId, category, title } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = new Date(String(startDate));
        if (endDate) filters.endDate = new Date(String(endDate));
        if (guardId) filters.guardId = Number(guardId);
        if (category) filters.category = String(category);
        if (title) filters.title = String(title);

        const result = await maintenanceService.getMaintenances(filters);
        return res.status(200).json(createTResult(result));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};

export const resolveMaintenance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json(createTResult(null, ["Usuario no autenticado"]));
        }

        const result = await maintenanceService.resolveMaintenance(Number(id), Number(userId));
        return res.status(200).json(createTResult(result));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};

export const getPendingCount = async (req: Request, res: Response) => {
    try {
        const count = await maintenanceService.getPendingMaintenancesCount();
        return res.status(200).json(createTResult({ count }));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};
