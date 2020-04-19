import { getRepository } from 'typeorm';
import path from 'path';
import fs from 'fs';
import csv from 'csvtojson';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  csvFilename: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const categoriesRepository = getRepository(Category);

    const transactions: Transaction[] = [];
    const categories: Category[] = [];

    const csvFilePath = path.join(uploadConfig.directory, csvFilename);

    const checkExtension = path.extname(csvFilePath);

    if (checkExtension !== '.csv') {
      await fs.promises.unlink(csvFilePath);
      throw new AppError('File extension is invalid');
    }

    const transactionsCsv = await csv().fromFile(csvFilePath);

    // eslint-disable-next-line no-restricted-syntax
    for (const transactionCsv of transactionsCsv) {
      const { title, type, value, category } = transactionCsv;

      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute({
        title,
        type,
        value: Number(value),
        category,
      });

      // eslint-disable-next-line no-await-in-loop
      const categoryList = await categoriesRepository.findOne({
        where: { title: category },
      });

      if (categoryList) {
        const categoryExists = categories.find(item => {
          return item.id === categoryList.id;
        });
        if (!categoryExists) {
          categories.push(categoryList);
        }
      }

      transactions.push(transaction);
    }

    await fs.promises.unlink(csvFilePath);

    transactions.map(item => {
      const categoryFind = categories.find(category => {
        return category.id === item.category_id;
      });
      if (categoryFind) {
        item.category = categoryFind;
      }
      return item;
    });

    return transactions;
  }
}

export default ImportTransactionsService;
