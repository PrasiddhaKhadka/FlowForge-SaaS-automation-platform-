import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/http.errors.js";
import { prisma } from "../lib/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt.utils.js";
import { comparePassword, hashPassword } from "../utils/password.utils.js";

export interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const signup = async (input: SignupInput): Promise<AuthTokens> => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("Email already in use");
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  return generateTokensForUser(user.id, user.email);
};

export const login = async (input: LoginInput): Promise<AuthTokens> => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await comparePassword(input.password, user.password);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return generateTokensForUser(user.id, user.email);
};

export const refresh = async (token: string):Promise<AuthTokens> => {
  const stored = await prisma.refreshToken.findUnique({
    where: {
      token: token,
    },
    include: { user: true },
  });

  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });

    throw new UnauthorizedError("Refresh token expired");
  }

  await prisma.refreshToken.delete({ where: { token } });

  return generateTokensForUser(stored.user.id, stored.user.email);
};

export const logout = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

const generateTokensForUser = async (
  userId: string,
  email: string,
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
};
