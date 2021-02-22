import { getRepository, In, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import LoadCSVService from '../services/LoadCSVService';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(transactionsFilename: string): Promise<Transaction[]> {
    const loadCSVService = new LoadCSVService();
    const csvFileData = await loadCSVService.execute(transactionsFilename);

    const csvTransactions: Array<RequestTransaction> = csvFileData.map(
      (fileTransaction: Array<string>) => ({
        title: fileTransaction[0],
        type: fileTransaction[1],
        value: Number(fileTransaction[2]),
        category: fileTransaction[3],
      }),
    );

    const categories = csvTransactions.map(transaction => transaction.category);

    const categoriesRepository = getRepository(Category);

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const newCategoriesTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const createdCategories = categoriesRepository.create(
      newCategoriesTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(createdCategories);

    const allCategories = [...existentCategories, ...createdCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const createdTransactions = transactionsRepository.create(
      csvTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;