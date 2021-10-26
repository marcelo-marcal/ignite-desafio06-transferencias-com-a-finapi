import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IAuthenticateUserResponseDTO } from "./IAuthenticateUserResponseDTO";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserCase: AuthenticateUserUseCase;

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be able to authenticate an user", async () => {
    const user: ICreateUserDTO = {
      name: "Marcelo Marçal",
      email: "marcelo@gmail.com",
      password: "12345",
    };

    await createUserUseCase.execute(user);

    const result = await authenticateUserCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(result).toEqual(
      expect.objectContaining({
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      })
    );
  });

  it("Should not be able to authenticate an nonexistent user", async () => {
    await expect(
      authenticateUserCase.execute({
        email: "false@mail.com",
        password: "false",
      })
    ).rejects.toEqual(new IncorrectEmailOrPasswordError());
  });

  it("Should not be able to authenticate an incorrect password", async () => {
    const user: ICreateUserDTO = {
      name: "Marcelo Marçal",
      email: "marcelo@gmail.com",
      password: "12345",
    };

    await createUserUseCase.execute(user);

    await expect(
      authenticateUserCase.execute({
        email: user.email,
        password: "incorrect",
      })
    ).rejects.toEqual(new IncorrectEmailOrPasswordError());
  });
});
