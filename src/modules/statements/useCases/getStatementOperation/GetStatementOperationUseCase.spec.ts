import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";

import { OperationType } from "../../entities/Statement";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe("Get statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to get a statement", async () => {
    const user = await createUserUseCase.execute({
      name: "Marcelo Marçal",
      email: "marcelo@gmail.com",
      password: "12345",
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id,
      amount: 4000,
      description: "income",
      type: "deposit" as OperationType,
    });

    const result = await getStatementOperationUseCase.execute({
      user_id: statement.user_id,
      statement_id: statement.id,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: result.id,
        user_id: result.user_id,
        type: result.type,
        amount: result.amount,
        description: result.description,
      })
    );
  });

  it("Should not be able to get a statement of a nonexistent user", async () => {
    await expect(
      getStatementOperationUseCase.execute({
        user_id: "111111111111111111111111",
        statement_id: "2222222222222222222222",
      })
    ).rejects.toEqual(new GetStatementOperationError.UserNotFound());
  });

  it("Should not be able to get a nonexistent statement", async () => {
    const user = await createUserUseCase.execute({
      name: "Marcelo Marçal",
      email: "marcelo@gmail.com",
      password: "12345",
    });

    await expect(
      getStatementOperationUseCase.execute({
        user_id: user.id,
        statement_id: "2222222222222222222222",
      })
    ).rejects.toEqual(new GetStatementOperationError.StatementNotFound());
  });
});
