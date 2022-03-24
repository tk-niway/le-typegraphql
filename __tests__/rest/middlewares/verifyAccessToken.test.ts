import request from "supertest";
import { api } from "../../../rest";

describe("TEST Middleware verifyAccessToken", () => {
  test("it should be success", async () => {
    const res = await request(api)
      .get("/api/v1/auth")
      .set("Authorization", "Bearer token_admin_user");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("currentUser");
    expect(res.body.currentUser).toHaveProperty("id");
    expect(res.body.currentUser).toHaveProperty("username");
    expect(res.body.currentUser).toHaveProperty("firebaseId");
    expect(res.body.currentUser).toHaveProperty("isAdmin");
    expect(res.body.currentUser).toHaveProperty("isAdmin");
    expect(res.body.currentUser).toHaveProperty("isActive");
    expect(res.body.currentUser).toHaveProperty("isAnonymous");
    expect(res.body.currentUser).not.toHaveProperty("password");
  });

  test("it should be fail request without token by firebase API", async () => {
    const res = await request(api).get("/api/v1/auth");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("it should be fail by Prisma API", async () => {
    const res = await request(api)
      .get("/api/v1/auth")
      .set("Authorization", "Bearer 123450");

    expect(res.status).toBe(400);
    expect(res.body.currentUser).toBeUndefined();
    expect(res.body.code).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("TEST Health check", async () => {
    const { status, body } = await request(api).get("/api/v1/health");
    expect(status).toBe(200);
    expect(body).not.toBeUndefined();
  });
});
