import path from 'path';
import fs from 'fs';
import csv from 'csvtojson';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  csvFilename: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, csvFilename);

    const checkExtension = path.extname(csvFilePath);

    if (checkExtension !== '.csv') {
      await fs.promises.unlink(csvFilePath);
      throw new AppError('File extension is invalid');
    }

    const transactionsCsv = await csv().fromFile(csvFilePath);

    const createTransaction = new CreateTransactionService();

    const transactions: Transaction[] = [];

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

      transactions.push(transaction);
    }

    await fs.promises.unlink(csvFilePath);

    return transactions;
  }
}

export default ImportTransactionsService;
