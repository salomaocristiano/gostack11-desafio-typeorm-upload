import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions: Transaction[] = await this.find();

    const { income, outcome } = transactions.reduce(
      (balance: Balance, transaction: Transaction) => {
        if (transaction.type === 'income') {
          balance.income += Number(transaction.value);
        } else if (transaction.type === 'outcome') {
          balance.outcome += Number(transaction.value);
        }

        return balance;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    const total = income - outcome;

    return { income, outcome, total };
  }

  public async findAll(): Promise<Transaction[]> {
    const transactionList = await this.find({
      select: ['id', 'title', 'value', 'type'],
      relations: ['category'],
    });
    const transactions = transactionList.map((transaction: Transaction) => {
      delete transaction.category.created_at;
      delete transaction.category.updated_at;
      transaction.value = Number(transaction.value);
      return transaction;
    });

    return transactions;
  }
}

export default TransactionsRepository;
