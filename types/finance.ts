export type AccountType = 'cash' | 'savings' | 'investment' | 'loan' | 'credit';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export type MainCategory = '지출' | '수입' | '저축' | '투자';

export interface CategoryItem {
  id: string;
  mainCategory: MainCategory;
  subCategory: string;
}

export type TransactionType = 'income' | 'expense' | 'savings' | 'investment' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format
  amount: number;
  type: TransactionType;
  fromAccountId: string;
  toAccountId: string;
  merchant: string;
  mainCategory: string;
  subCategory: string;
  memo: string;
  isRecurring: boolean;
}

export interface Budget {
  categoryId: string; // references CategoryItem.id
  yearMonth: string; // format: YYYY-MM
  targetAmount: number;
  warningThreshold: number; // e.g. 0.8 for 80%
}

export interface AssetValuation {
  assetId: string; // references Account.id
  date: string;
  valuation: number;
  changeAmount: number;
  memo: string;
}

export interface Recurring {
  id: string;
  name: string;
  payDate: number; // 1-31
  amount: number;
  accountId: string;
}
