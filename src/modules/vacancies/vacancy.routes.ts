import Router from "express";
import { create, list, getOne, update, getByQrToken, remove } from "./vacancy.controller";

const router = Router();

router.get("/", list);
router.get("/:id", getOne);
router.get("/public/:token", getByQrToken);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
