import supertest from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";
import { beforeEach, describe, it, afterAll, expect } from "@jest/globals";

const request = supertest(app);

const TEST_USER = {
  email: "routes@test.com",
  password: "password123",
  firstName: "Jane",
  lastName: "Doe",
};

describe("Auth Routes", () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { email: TEST_USER.email } },
    });
    await prisma.user.deleteMany({
      where: { email: TEST_USER.email },
    });
  });

  // ─── POST /api/v1/signup ───────────────────────────────────────────────────
  
  describe("POST /api/v1/signup", () => {
    it("should return 201 with tokens on valid input", async () => {
      const res = await request.post("/api/v1/signup").send(TEST_USER);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should return 400 when fields are missing", async () => {
      const res = await request
        .post("/api/v1/signup")
        .send({ email: TEST_USER.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when password is too short", async () => {
      const res = await request
        .post("/api/v1/signup")
        .send({ ...TEST_USER, password: "123" });

      expect(res.status).toBe(400);
    });

    it("should return 409 when email already exists", async () => {
      await request.post("/api/v1/signup").send(TEST_USER);
      const res = await request.post("/api/v1/signup").send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    // ─── POST /api/v1/login ────────────────────────────────────────────────────

    describe("POST /api/v1/login", () => {
      beforeEach(async () => {
        await request.post("/api/v1/signup").send(TEST_USER);
      });

      it("should return 200 with tokens on valid credentials", async () => {
        const res = await request
          .post("/api/v1/login")
          .send({ email: TEST_USER.email, password: TEST_USER.password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
      });

      it("should return 401 on wrong password", async () => {
        const res = await request
          .post("/api/v1/login")
          .send({ email: TEST_USER.email, password: "wrongpassword" });

        expect(res.status).toBe(401);
      });

      it("should return 401 on non-existent email", async () => {
        const res = await request
          .post("/api/v1/login")
          .send({ email: "ghost@test.com", password: "password123" });

        expect(res.status).toBe(401);
      });

      it("should return 400 when fields are missing", async () => {
        const res = await request
          .post("/api/v1/login")
          .send({ email: TEST_USER.email }); // no password

        expect(res.status).toBe(400);
      });
    });

    // ─── POST /api/v1/refresh ──────────────────────────────────────────────────

    describe("POST /api/v1/refresh", () => {
      it("should return new tokens on valid refresh token", async () => {
        const signup = await request.post("/api/v1/signup").send(TEST_USER);

        const { refreshToken } = signup.body;

        const res = await request
          .post("/api/v1/refresh")
          .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body.refreshToken).not.toBe(refreshToken);
      });

      it("should return 401 on invalid refresh token", async () => {
        const res = await request
          .post("/api/v1/refresh")
          .send({ refreshToken: "fake-token" });

        expect(res.status).toBe(401);
      });

      it("should return 400 when refreshToken is missing", async () => {
        const res = await request.post("/api/v1/refresh").send({});

        expect(res.status).toBe(400);
      });
    });

    // ─── POST /api/v1/logout ───────────────────────────────────────────────────

    describe("POST /api/v1/logout", () => {
      it("should return 200 and invalidate the refresh token", async () => {
        const signup = await request.post("/api/v1/signup").send(TEST_USER);
        const { refreshToken } = signup.body;

        const res = await request.post("/api/v1/logout").send({ refreshToken });

        expect(res.status).toBe(200);

        // using the same token after logout should now fail
        const refreshAttempt = await request
          .post("/api/v1/refresh")
          .send({ refreshToken });

        expect(refreshAttempt.status).toBe(401);
      });
    });

    // ─── GET /api/v1/me ────────────────────────────────────────────────────────

    describe("GET /api/v1/me", () => {
      it("should return user data with valid access token", async () => {
        const signup = await request.post("/api/v1/signup").send(TEST_USER);
        const { accessToken } = signup.body;

        const res = await request
          .get("/api/v1/me")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(TEST_USER.email);
        expect(res.body.data).not.toHaveProperty("password");
      });

      it("should return 401 with no token", async () => {
        const res = await request.get("/api/v1/me");
        expect(res.status).toBe(401);
      });

      it("should return 401 with invalid token", async () => {
        const res = await request
          .get("/api/v1/me")
          .set("Authorization", "Bearer fake.token.here");

        expect(res.status).toBe(401);
      });
    });
    
    // ─── GET /health ───────────────────────────────────────────────────────────

    describe("GET /health", () => {
      it("should return service status", async () => {
        const res = await request.get("/health");

        expect(res.status).toBe(200);
        expect(res.body.service).toBe("auth-service");
        expect(res.body.status).toBe("ok");
      });
    });
  });
});
