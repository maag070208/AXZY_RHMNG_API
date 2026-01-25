import { createTResult } from "@src/core/mappers/tresult.mapper";
import { Request, Response } from "express";
import { StorageService } from "../storage/storage.service";
import * as incidentService from "./incident.service";

const storageService = new StorageService();

export const createIncident = async (req: Request, res: Response) => {
  try {
    const { title, category, description, media } = req.body;
    // @ts-ignore
    const guardId = req.user?.id;

    if (!guardId) {
        return res.status(401).json(createTResult(null, ["Usuario no autenticado"]));
    }
    
    // Media is now passed as an array of objects { type, url, key }
    const mediaFiles = media || [];

    const result = await incidentService.createIncident({
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

export const getIncidents = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, guardId, category, title } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = new Date(String(startDate));
        if (endDate) filters.endDate = new Date(String(endDate));
        if (guardId) filters.guardId = Number(guardId);
        if (category) filters.category = String(category);
        if (title) filters.title = String(title);

        const result = await incidentService.getIncidents(filters);
        return res.status(200).json(createTResult(result));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};

export const resolveIncident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json(createTResult(null, ["Usuario no autenticado"]));
        }

        const result = await incidentService.resolveIncident(Number(id), Number(userId));
        return res.status(200).json(createTResult(result));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};

export const getPendingCount = async (req: Request, res: Response) => {
    try {
        const count = await incidentService.getPendingIncidentsCount();
        return res.status(200).json(createTResult({ count }));
    } catch (error: any) {
        return res.status(500).json(createTResult(null, error.message));
    }
};
