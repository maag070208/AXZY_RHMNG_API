import { Request, Response } from "express";
import { createTResult } from "@src/core/mappers/tresult.mapper";
import { addUser, getUserByUsername, getUsers, getDataTableUsers } from "./user.service";

export const getDataTable = async (req: Request, res: Response) => {
  try {
    const result = await getDataTableUsers(req.body);
    return res.status(200).json(createTResult(result));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

import {
  comparePassword,
  generateJWT,
  hashPassword,
} from "@src/core/utils/security";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json(createTResult("", ["User not found"]));
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(createTResult("", ["Contraseña invalida"]));
    }

    if (user.status !== "ACTIVE") {
      return res.status(401).json(createTResult("", ["Usuario inactivo"]));
    }

    return res.status(200).json(createTResult(await generateJWT(user)));
  } catch (error: any) {
    return res.status(500).json(createTResult("", error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
     return res.status(200).json(createTResult(true)); 
  } catch (error: any) {
      return res.status(500).json(createTResult("", error.message));
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const users = await getUsers(q as string);

    return res.status(200).json(createTResult(users));
  } catch (error: any) {
    return res.status(500).json(createTResult("", error.message));
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, lastName, username, password, role } = req.body;

    const existing = await getUserByUsername(username);
    if (existing) {
      return res
        .status(400)
        .json(createTResult(null, ["Username ya existe"]));
    }

    const hashed = await hashPassword(password);

    const user = await addUser({
      name,
      lastName,
      username,
      password: hashed,
      role: role ?? "RECLUTADOR",
    });

    return res.status(201).json(createTResult(user));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, lastName, username, role, status } = req.body;

    const { updateUser } = require("./user.service");

    const updated = await updateUser(Number(id), {
      name,
      lastName,
      username,
      role,
      status
    });

    return res.status(200).json(createTResult(updated));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const { getUserById, updateUser } = require("./user.service");

    const user = await getUserById(Number(id));
    if (!user) {
      return res.status(404).json(createTResult(null, ["User not found"]));
    }

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      return res
        .status(400)
        .json(createTResult(null, ["La contraseña actual es incorrecta"]));
    }

    const hashed = await hashPassword(newPassword);
    await updateUser(Number(id), { password: hashed });

    return res.status(200).json(createTResult(true));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const { updateUser } = require("./user.service");

    const hashed = await hashPassword(newPassword);
    await updateUser(Number(id), { password: hashed });

    return res.status(200).json(createTResult(true));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteUser: deleteUserService } = require("./user.service");
    await deleteUserService(Number(id));
    return res.status(200).json(createTResult(true));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
