import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { prisma } from "../lib/prisma.js";
import * as authService from "../services/auth.service.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../errors/index.js";

const TEST_USER = {
  email: "service@test.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
};

describe("Auth Service", () => {
  // clean slate before each test
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: TEST_USER.email,
      },
    });

    await prisma.user.deleteMany({
      where: { email: TEST_USER.email },
    });
  });

  // ─── signup ────────────────────────────────────────────────────────────────

  describe("signup", () => {
    it("should create a user and return access + refresh tokens", async () => {
      const result = await authService.signup(TEST_USER);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
    });

    it("should store hashed password — not plain text", async () => {
      await authService.signup(TEST_USER);

      const user = await prisma.user.findUnique({
        where: { email: TEST_USER.email },
      });

      expect(user).not.toBeNull();
      expect(user!.password).not.toBe(TEST_USER.password);
      expect(user!.password).toMatch(/^\$2[ab]\$/);
    });

    it("should store a refresh token in the database", async () => {
      const { refreshToken } = await authService.signup(TEST_USER);

      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      expect(stored).not.toBeNull();
      expect(stored!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should throw ConflictError when email already exists", async () => {
      await authService.signup(TEST_USER);

      await expect(authService.signup(TEST_USER)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe("login", () => {
    beforeEach(async () => {
      await authService.signup(TEST_USER);
    });

    it("should return tokens on valid credentials", async () => {
      const result = await authService.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("accessToken");
    });

    it("should throw UnauthorizedError on wrong password", async () => {
      await expect(
        authService.login({
          email: TEST_USER.email,
          password: "wrongpassword",
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError on non-existent email", async () => {
      await expect(
        authService.login({ email: "ghost@test.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should create a new refresh token in db on each login", async () => {
      await authService.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      await authService.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      const user = await prisma.user.findUnique({
        where: { email: TEST_USER.email },
        include: { refreshToken: true },
      });

      // two logins = two refresh tokens stored
      expect(user!.refreshToken.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────────────

  describe("refresh", () => {
    it("should return new tokens and rotate the refresh token", async () => {
      const { refreshToken: oldToken } = await authService.signup(TEST_USER);
      const result = await authService.refresh(oldToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      // new refresh token must be different
      expect(result.refreshToken).not.toBe(oldToken);
    });

    it("should delete the old refresh token after rotation", async () => {
      const { refreshToken: oldToken } = await authService.signup(TEST_USER);
      await authService.refresh(oldToken);

      const old = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
      });

      expect(old).toBeNull();
    });

    it("should throw UnauthorizedError on invalid token", async () => {
      await expect(authService.refresh("totally-fake-token")).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe("logout", () => {
    it("should delete the refresh token from database", async () => {
      const { refreshToken } = await authService.signup(TEST_USER);
      await authService.logout(refreshToken);

      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      expect(stored).toBeNull();
    });

    it("should not throw if token does not exist", async () => {
      await expect(
        authService.logout("non-existent-token"),
      ).resolves.not.toThrow();
    });
  });

  // ─── getMe ─────────────────────────────────────────────────────────────────

  describe("getMe", () => {
    it("should return user data without password", async () => {
      await authService.signup(TEST_USER);
      const user = await prisma.user.findUnique({
        where: { email: TEST_USER.email },
      });

      const result = await authService.getMe(user!.id);

      expect(result.email).toBe(TEST_USER.email);
      expect(result.firstName).toBe(TEST_USER.firstName);
      expect(result).not.toHaveProperty("password"); // never expose password
    });

    it("should throw NotFoundError for invalid userId", async () => {
      await expect(authService.getMe("non-existent-uuid")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
