import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const repositoryExists = await transactionsRepository.findOne({
      where: { id },
    });

    if (!repositoryExists) {
      throw new AppError('Transaction is not exists.');
    }

    await transactionsRepository.remove(repositoryExists);
  }
}

export default DeleteTransactionService;
