import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as orgService from "../services/org.service.js";
import { BadRequestError } from "../errors/http.errors.js";

export const createOrg = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    if (!name) throw new BadRequestError("Organization name is required");

    const org = await orgService.createOrg(req.user!.userId, name);
    res.status(201).json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
};

export const getUserOrgs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgs = await orgService.getUserOrgs(req.user!.userId);
    res.status(200).json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
};

export const getOrg = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await orgService.getOrg(
      req.user!.userId,
      req.params.orgId as string,
    );
    res.status(200).json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
};

export const inviteMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { targetUserId, role } = req.body;
    if (!targetUserId || !role)
      throw new BadRequestError("targetUserId and role are required");
    if (!["ADMIN", "MEMBER"].includes(role))
      throw new BadRequestError("Role must be ADMIN or MEMBER");

    const member = await orgService.inviteMember(
      req.user!.userId,
      req.params.orgId as string,
      targetUserId,
      role,
    );

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const members = await orgService.getMembers(
      req.user!.userId,
      req.params.orgId as string,
    );
    res.status(200).json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await orgService.removeMember(
      req.user!.userId,
      req.params.orgId as string,
      req.params.userId as string,
    );
    res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    next(err);
  }
};
