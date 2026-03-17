import { Request, Response } from "express";
import { createTResult } from "@src/core/mappers/tresult.mapper";
import {
  createVacancy,
  getVacancies,
  getVacancyById,
  getVacancyByQrToken,
  updateVacancy,
  deleteVacancy,
} from "./vacancy.service";

const mergeDateTime = (date: any, timeStr: any) => {
  if (!timeStr) return null;
  
  // If timeStr is already a full ISO string/date, just return it as a Date object
  if (String(timeStr).includes('T') || !isNaN(Date.parse(timeStr))) {
    return new Date(timeStr);
  }

  if (!date) return null;
  const d = new Date(date);
  const [hours, minutes] = String(timeStr).split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return d;
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const create = async (req: Request, res: Response) => {
  try {
    const { title, description, department, salary, positions, startDate, endDate, workSchedule, slots } = req.body;
    
    // user ID can be from res.locals.user.id if auth middleware provides it
    const createdById = res.locals.user?.id; 

    const vacancy = await createVacancy({
      title,
      description,
      department,
      salary: salary ? Number(salary) : null,
      positions: positions ? Number(positions) : 1,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      workSchedule,
      slots: slots && Array.isArray(slots) ? {
        create: slots.map((s: any) => ({
          startTime: mergeDateTime(s.date || startDate, s.startTime),
          endTime: mergeDateTime(s.date || startDate, s.endTime),
          positions: s.positions ? Number(s.positions) : 1
        }))
      } : undefined,
      createdBy: createdById ? { connect: { id: createdById } } : undefined
    });

    return res.status(201).json(createTResult(vacancy));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // ensure data fields are handled correctly
    if (data.salary !== undefined) data.salary = data.salary ? Number(data.salary) : null;
    if (data.positions !== undefined) data.positions = Number(data.positions);
    
    if (data.startDate !== undefined) data.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) data.endDate = data.endDate ? new Date(data.endDate) : null;

    // Handle slots if provided (replace all strategy)
    if (data.slots && Array.isArray(data.slots)) {
      data.slots = {
        deleteMany: {},
        create: data.slots.map((s: any) => ({
          startTime: mergeDateTime(s.date || s.startTime, s.startTime),
          endTime: mergeDateTime(s.date || s.endTime, s.endTime),
          positions: s.positions ? Number(s.positions) : 1
        }))
      };
    } else {
      delete data.slots;
    }

    const updated = await updateVacancy(Number(id), data);
    return res.status(200).json(createTResult(updated));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteVacancy(Number(id));
    return res.status(200).json(createTResult(true));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const vacancies = await getVacancies(status as any);
    return res.status(200).json(createTResult(vacancies));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancy = await getVacancyById(Number(id));
    if (!vacancy) return res.status(404).json(createTResult(null, ["Vacante no encontrada"]));
    return res.status(200).json(createTResult(vacancy));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getByQrToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const vacancy = await getVacancyByQrToken(token);
    if (!vacancy) return res.status(404).json(createTResult(null, ["Vacante no encontrada"]));
    return res.status(200).json(createTResult(vacancy));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
