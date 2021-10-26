import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { hash } from "bcryptjs";
import { Connection } from "typeorm";
import createConnection from "../../../../database";

import { app } from "../../../../app";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const passsword = await hash("12345", 8);

    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at, updated_at)
            VALUES ('${id}', 'Lorenzo Marcelo', 'lorenzo@gmail.com', '${passsword}', now(), now())`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user).toHaveProperty("name");
    expect(response.body.user).toHaveProperty("email");
  });

  it("should not be able to authenticate with nonexistent user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "jose@gmail.com",
      password: "12345",
    });

    expect(response.status).toBe(401);
  });

  it("should not be able to authenticate with incorrect password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12300",
    });

    expect(response.status).toBe(401);
  });
});
