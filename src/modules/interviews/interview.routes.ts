import Router from "express";
import { list, getOne, schedule, update } from "./interview.controller";

const router = Router();

router.get("/", list);
router.get("/:id", getOne);
router.post("/", schedule);
router.put("/:id", update);

export default router;
