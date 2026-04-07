import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors/http.errors.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as authService from "../services/auth.service.js";


export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new BadRequestError("All fields are required");
    }

    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const tokens = await authService.signup({
      email,
      password,
      firstName,
      lastName,
    });

    res
      .status(201)
      .json({ success: true, message: "Account created", ...tokens });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const tokens = await authService.login({ email, password });
    res
      .status(200)
      .json({ success: true, message: "Login successful", ...tokens });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new BadRequestError("Refresh token is required");

    const tokens = await authService.refresh(refreshToken);

    res.status(200).json({ success: true, ...tokens });
  } catch (err) {
    next(err);
  }
};


export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new BadRequestError('Refresh token is required');

    await authService.logout(refreshToken);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};


export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};