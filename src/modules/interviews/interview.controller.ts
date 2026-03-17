import { Request, Response } from "express";
import { createTResult } from "@src/core/mappers/tresult.mapper";
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
} from "./interview.service";

export const schedule = async (req: Request, res: Response) => {
  try {
    const { scheduledAt, notes, vacancyId, applicantId, interviewerId } = req.body;

    const interview = await createInterview({
      scheduledAt: new Date(scheduledAt),
      notes,
      vacancyId: Number(vacancyId),
      applicantId: Number(applicantId),
      interviewerId: interviewerId ? Number(interviewerId) : res.locals.user?.id,
    });

    // Optionally update applicant status to INTERVIEW_SCHEDULED
    const { updateApplicant } = require("../applicants/applicant.service");
    await updateApplicant(Number(applicantId), { status: "INTERVIEW_SCHEDULED" });

    return res.status(201).json(createTResult(interview));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const { vacancyId, applicantId } = req.query;
    const interviews = await getInterviews(
      vacancyId ? Number(vacancyId) : undefined,
      applicantId ? Number(applicantId) : undefined
    );
    return res.status(200).json(createTResult(interviews));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await getInterviewById(Number(id));
    if (!interview) return res.status(404).json(createTResult(null, ["Entrevista no encontrada"]));
    return res.status(200).json(createTResult(interview));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt, notes, status, interviewerId } = req.body;

    const updated = await updateInterview(Number(id), {
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(notes && { notes }),
      ...(status && { status }),
      ...(interviewerId && { interviewerId: Number(interviewerId) }),
    });

    // Optional sync applicant status
    if (status === "COMPLETED") {
       const interview = await getInterviewById(Number(id));
       if (interview) {
          const { updateApplicant } = require("../applicants/applicant.service");
          await updateApplicant(interview.applicantId, { status: "INTERVIEWED" });
       }
    }

    return res.status(200).json(createTResult(updated));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
