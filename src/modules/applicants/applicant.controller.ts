import { Request, Response } from "express";
import { createTResult } from "@src/core/mappers/tresult.mapper";
import {
  createApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
} from "./applicant.service";
import { getVacancyByQrToken } from "../vacancies/vacancy.service";

import { prismaClient } from "@src/core/config/database";

export const applyViaQr = async (req: Request, res: Response) => {
  try {
    const { qrToken } = req.params;
    const vacancy = await getVacancyByQrToken(qrToken);

    if (!vacancy) {
      return res.status(404).json(createTResult(null, ["Vacante no encontrada"]));
    }

    if (vacancy.status !== "ACTIVE") {
      return res.status(400).json(createTResult(null, ["La vacante no está activa"]));
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      address,
      city,
      education,
      experience,
      resumeUrl,
      formData,
      slotId
    } = req.body;

    if (!slotId) {
      return res.status(400).json(createTResult(null, ["Debe seleccionar un horario de cita"]));
    }

    const slot = (vacancy as any).slots?.find((s: any) => s.id === Number(slotId));
    if (!slot) {
      return res.status(400).json(createTResult(null, ["El horario seleccionado no es válido para esta vacante"]));
    }

    const appliedToSlotCount = slot._count?.applicants || 0;
    if (appliedToSlotCount >= slot.positions) {
      return res.status(400).json(createTResult(null, ["Lo sentimos, este horario ya está lleno. Por favor seleccione otro."]));
    }

    // Use transaction to ensure both are created
    const result = await prismaClient.$transaction(async (tx) => {
      const applicant = await tx.applicant.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          address,
          city,
          education,
          experience,
          resumeUrl,
          formData,
          status: "INTERVIEW_SCHEDULED",
          formCompleted: true,
          vacancyId: vacancy.id,
          slotId: Number(slotId)
        }
      });

      await tx.interview.create({
        data: {
          scheduledAt: slot.startTime,
          status: "SCHEDULED",
          vacancyId: vacancy.id,
          applicantId: applicant.id
        }
      });

      return applicant;
    });

    return res.status(201).json(createTResult(result));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const { vacancyId } = req.query;
    const applicants = await getApplicants(vacancyId ? Number(vacancyId) : undefined);
    return res.status(200).json(createTResult(applicants));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const applicant = await getApplicantById(Number(id));
    if (!applicant) return res.status(404).json(createTResult(null, ["Candidato no encontrado"]));
    return res.status(200).json(createTResult(applicant));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // allow partial updates beyond just status
    const data = req.body;
    
    const updated = await updateApplicant(Number(id), data);
    return res.status(200).json(createTResult(updated));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
