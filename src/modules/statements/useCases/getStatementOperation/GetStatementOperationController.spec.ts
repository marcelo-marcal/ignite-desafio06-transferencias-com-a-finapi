import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { hash } from "bcryptjs";
import { Connection } from "typeorm";
import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;

describe("Get Statement Operation Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const passsword = await hash("12345", 8);

    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at, updated_at)
            VALUES ('${id}', 'Marcos Solza', 'marco@gmail.com', '${passsword}', now(), now())`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get a statement operation", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "marco@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const statementResponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 400,
        description: "income",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { id, user_id, amount, description, type, created_at, updated_at } =
      statementResponse.body;

    const response = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", id);
    expect(response.body).toHaveProperty("user_id", user_id);
    expect(response.body).toHaveProperty("amount", amount.toFixed(2));
    expect(response.body).toHaveProperty("description", description);
    expect(response.body).toHaveProperty("type", type);
    expect(response.body).toHaveProperty("created_at", created_at);
    expect(response.body).toHaveProperty("updated_at", updated_at);
  });

  it("should not be able to get a nonexistent statement operation", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "marco@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const fakeId = uuidV4();

    const response = await request(app)
      .get(`/api/v1/statements/${fakeId}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
  });

  it("should be able to get a statement operation from nonexistent user", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "marco@gmail.com",
      password: "12345",
    });

    const { token, user } = authResponse.body;

    const statementResponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 400,
        description: "income",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { id } = statementResponse.body;

    await connection.query(`DELETE FROM users WHERE id = '${user.id}'`);

    const response = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
  });
});
