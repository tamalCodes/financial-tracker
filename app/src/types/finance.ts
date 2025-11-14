export type TransactionType = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  institution?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  merchant: string;
  type: TransactionType;
  createdAt: string;
  notes?: string;
}
