import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (type === 'outcome') {
      const transactionsCustomRepository = getCustomRepository(
        TransactionsRepository,
      );
      const balance = await transactionsCustomRepository.getBalance();

      if (balance.total - value < 0) {
        throw new AppError('Transaction without a valid balance!');
      }
    }

    const categoriesRepository = getRepository(Category);

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    let category_id = null;
    if (categoryExists) {
      category_id = categoryExists.id;
    } else {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);

      category_id = newCategory.id;
    }

    const transactionsRepository = getRepository(Transaction);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
