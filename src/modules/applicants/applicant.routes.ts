import Router from "express";
import { list, getOne, updateStatus, applyViaQr } from "./applicant.controller";

const router = Router();

// Endpoint publico para postularse por QR
router.post("/apply/:qrToken", applyViaQr);

// Restantes endpoints que requieren autenticación
router.get("/", list);
router.get("/:id", getOne);
router.put("/:id", updateStatus);

export default router;
