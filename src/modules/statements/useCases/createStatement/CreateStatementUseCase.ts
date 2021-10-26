import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

@injectable()
export class CreateStatementUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ user_id, type, amount, description, receiver_user_id}: ICreateStatementDTO) {

    const user = await this.usersRepository.findById(user_id);

    if(!user) {
      throw new CreateStatementError.UserNotFound();
    }

    if(type === 'withdraw' || type === 'transfer') {
      const { balance } = await this.statementsRepository.getUserBalance({ user_id });

      if (balance < amount) {
        throw new CreateStatementError.InsufficientFunds()
      }
    }

    if(type === 'transfer') {
      const receiver_user = await this.usersRepository.findById(receiver_user_id);

      if(!receiver_user) {
        throw new CreateStatementError.ReceiverUserNotFound();
      }
  
    }
   
    const statementOperation = await this.statementsRepository.create({
      user_id,
      type,
      amount,
      description,
      receiver_user_id: receiver_user_id || null
    });

    return statementOperation;
  }
}
