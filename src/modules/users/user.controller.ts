import { Request, Response } from "express";
import { createTResult } from "@src/core/mappers/tresult.mapper";
import { addUser, getUserByUsername, getUsers } from "./user.service";

import {
  comparePassword,
  generateJWT,
  hashPassword,
} from "@src/core/utils/security";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log({ username, password });
    const user = await getUserByUsername(username);
    console.log(user);
    if (!user) {
      return res.status(401).json(createTResult("", ["User not found"]));
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(createTResult("", ["Contraseña invalida"]));
    }

    // Populate shift times from schedule if available
    const u = user as any;
    if (u.schedule) {
        u.shiftStart = u.schedule.startTime;
        u.shiftEnd = u.schedule.endTime;
    }

    // SHIFT CHECK
    if (user.role === 'GUARD' || user.role === 'SHIFT_GUARD') {
      const dayjs = require('dayjs');
      const customParseFormat = require('dayjs/plugin/customParseFormat');
      const isBetween = require('dayjs/plugin/isBetween');
      dayjs.extend(customParseFormat);
      dayjs.extend(isBetween);

      const now = dayjs();
      // Handle the case where shiftEnd is '07:00' (next day) and shiftStart is '23:00'
      // We need to construct full Date objects for comparison
      // If shiftEnd < shiftStart, it implies crossing midnight

      // Check if user has shift defined (either direct or via Schedule)
      const u = user as any;
      const shiftStart = u.schedule?.startTime || user.shiftStart;
      const shiftEnd = u.schedule?.endTime || user.shiftEnd;

      if (shiftStart && shiftEnd) {
         const currentStr = now.format('HH:mm');
         const startStr = shiftStart;
         const endStr = shiftEnd;
         
         // Simple comparison doesn't work for overnight.
         // Let's use a helper logic:
         let isInShift = false;
         if (endStr < startStr) {
             // Overnight shift (e.g. 23:00 to 07:00)
             // Valid if now >= 23:00 OR now <= 07:00
             isInShift = currentStr >= startStr || currentStr <= endStr;
         } else {
             // Normal shift (e.g. 07:00 to 15:00)
             isInShift = currentStr >= startStr && currentStr <= endStr;
         }

         if (!isInShift) {
             return res.status(403).json(createTResult("", ["Fuera de horario de turno"]));
         }

      }
    }

    // Update logged in status
    const { updateUser } = require('./user.service');
    await updateUser(user.id, { isLoggedIn: true });

    return res.status(200).json(createTResult(await generateJWT(user)));
  } catch (error: any) {
    return res.status(500).json(createTResult("", error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
     // Assuming user id is in req.body or derived from token if passed?
     // Actually logout is often just client-side, but we need to update DB.
     // If we use middleware, we have user in res.locals.user
     // But if token is expired? We might still want to clear DB.
     // Typically logout endpoint requires auth.
     
     // Let's assume passed in body or strictly from auth middleware.
     // If we use auth middleware, we can access user id.
     const { id } = req.body; // Or from token
     // If we use middleware, 'req.user' or 'res.locals.user'
     // Let's rely on body for simplicity if middleware not used, or better user attached.
     // I'll check if user attached.
     
     // Actually, let's use the ID from the token if available. 
     // But if token invalid, we can't identify user easily to logout.
     // Let's accept ID in body for force logout, or rely on token.
     // User requirement: "si se sale de app, no cerrarle sesion". 
     // "cerrarle la sesion en automatico" if active out of shift.
     
     // For explicit logout (button click):
     if (res.locals.user) {
         const { updateUser } = require('./user.service');
         await updateUser(res.locals.user.id, { isLoggedIn: false });
         return res.status(200).json(createTResult(true));
     } else {
         // Maybe passed in body?
         if (req.body.userId) {
             const { updateUser } = require('./user.service');
             await updateUser(req.body.userId, { isLoggedIn: false });
             return res.status(200).json(createTResult(true));
         }
     }
     
     return res.status(200).json(createTResult(true)); // Just return specific success even if no-op
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
    const { name, lastName, username, password, role, shiftStart, shiftEnd, scheduleId } =
      req.body;

    const existing = await getUserByUsername(username);
    if (existing) {
      return res
        .status(400)
        .json(createTResult(null, ["Username already exists"]));
    }

    const hashed = await hashPassword(password);

    const user = await addUser({
      name,
      lastName,
      username,

      password: hashed,
      role: role ?? "USER",
      shiftStart,
      shiftEnd,
      scheduleId: scheduleId ? Number(scheduleId) : undefined
    });

    return res.status(201).json(createTResult(user));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};

export const getCoachesList = async (req: Request, res: Response) => {
  try {
    const { getCoaches } = require("./user.service");
    const coaches = await getCoaches();
    return res.status(200).json(createTResult(coaches));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, lastName, username, shiftStart, shiftEnd, scheduleId } = req.body;

    const { updateUser } = require("./user.service");

    const updated = await updateUser(Number(id), {
      name,
      lastName,
      username,
      shiftStart,
      shiftEnd,
      scheduleId: scheduleId ? Number(scheduleId) : undefined
    });

    // Generate new token with updated info? Or just return success.
    // Client might need to re-login or update local state.
    // For now returning the updated user.
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

    // TODO: Verify ADMIN role here if middleware doesn't.
    // Assuming this endpoint is protected/admin-only.

    const hashed = await hashPassword(newPassword);
    await updateUser(Number(id), { password: hashed });

    return res.status(200).json(createTResult(true));
  } catch (error: any) {
    return res.status(500).json(createTResult(null, error.message));
  }
};
