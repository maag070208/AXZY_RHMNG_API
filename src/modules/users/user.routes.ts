import Router from "express";
import { createUser, getAllUsers, login, getCoachesList, updateUserProfile, changePassword, logout, resetPassword } from "./user.controller";

const router = Router();

router.get("/", getAllUsers);
router.get("/coaches", getCoachesList);
router.post("/login", login);
router.post("/", createUser);
router.put("/:id", updateUserProfile);
router.put("/:id/password", changePassword);
router.put("/:id/reset-password", resetPassword);
router.post("/logout", logout); 



export default router;
