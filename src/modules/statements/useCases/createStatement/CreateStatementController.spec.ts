import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { hash } from "bcryptjs";
import { Connection } from "typeorm";
import createConnection from "../../../../database";

import { app } from "../../../../app";

let connection: Connection;

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id_user1 = uuidV4();
    const passsword_user1 = await hash("12345", 8);

    const id_user2 = uuidV4();
    const passsword_user2 = await hash("12345", 8);

    const id_user3 = uuidV4();
    const passsword_user3 = await hash("12345", 8);

    const id_user4 = uuidV4();
    const passsword_user4 = await hash("12345", 8);

    await connection.query(
      `
            INSERT INTO users (id, name, email, password, created_at, updated_at)
            VALUES ('${id_user1}', 'Lorenzo Marcelo', 'lorenzo@gmail.com', '${passsword_user1}', now(), now())
            `
    );

    await connection.query(
      `
            INSERT INTO USERS(id, name, email, password, created_at, updated_at)
            values('${id_user2}', 'Marcos Solza', 'marco@gmail.com', '${passsword_user2}', 'now', 'now')
            `
    );

    await connection.query(
      `
            INSERT INTO USERS(id, name, email, password, created_at, updated_at)
            values('${id_user3}', 'Jose', 'jose@gmail.com', '${passsword_user3}', 'now', 'now')
            `
    );

    await connection.query(
      `
            INSERT INTO USERS(id, name, email, password, created_at, updated_at)
            values('${id_user4}', 'Ricardo', 'ricardo@gmail.com', '${passsword_user4}', 'now', 'now')
            `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a deposit", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 400,
        description: "income",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body).toHaveProperty("description", "income");
    expect(response.body).toHaveProperty("amount", 400);
    expect(response.body).toHaveProperty("type", "deposit");
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should be able to create a withdraw", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 200,
        description: "rental",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body).toHaveProperty("description", "rental");
    expect(response.body).toHaveProperty("amount", 200);
    expect(response.body).toHaveProperty("type", "withdraw");
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to create a withdraw with insufficient funds", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 500,
        description: "rental",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient funds");
  });

  it("should not be able to create statement from nonexistent user", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "jose@gmail.com",
      password: "12345",
    });

    const { token, user } = authResponse.body;

    await connection.query(`DELETE FROM users WHERE id = '${user.id}'`);

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 400,
        description: "income",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should be able to create a transfer", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 200,
        description: "income",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const [receiver_user] = await connection.query(
      `
            SELECT id FROM USERS WHERE name = 'Marcos Solza'
            `
    );

    const { id } = receiver_user;

    const response = await request(app)
      .post(`/api/v1/statements/transfer/${id}`)
      .send({
        amount: 150,
        description: "payment",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body).toHaveProperty("receiver_user_id");
    expect(response.body).toHaveProperty("description", "payment");
    expect(response.body).toHaveProperty("amount", 150);
    expect(response.body).toHaveProperty("type", "transfer");
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to create a transfer with insufficient funds", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const [receiver_user] = await connection.query(
      `
                SELECT id FROM USERS WHERE name = 'Marcos Solza'
                `
    );

    const { id } = receiver_user;

    const response = await request(app)
      .post(`/api/v1/statements/transfer/${id}`)
      .send({
        amount: 8000,
        description: "payment",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient funds");
  });

  it("should not be able to create a transfer with nonexistent receiver user", async () => {
    const authResponse = await request(app).post("/api/v1/sessions").send({
      email: "lorenzo@gmail.com",
      password: "12345",
    });

    const { token } = authResponse.body;

    const fake_receiver_id = uuidV4();

    const response = await request(app)
      .post(`/api/v1/statements/transfer/${fake_receiver_id}`)
      .send({
        amount: 50,
        description: "payment",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Receiver user not found");
  });
});
