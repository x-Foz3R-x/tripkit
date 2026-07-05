export type Expense = {
  id: string;
  payer_id: string;
  amount: number;
  split_among: string[];
};

export type User = {
  id: string;
  name: string;
};

export type Transaction = {
  from: string; // id dłużnika
  to: string; // id wierzyciela
  amount: number;
};
