export type Household = {
  personAName: string;
  personBName: string;
  createdAt: string;
};

export type Expense = {
  id: number;
  spender: string;
  spentOn: string;
  amount: number;
  purpose: string;
  createdAt: string;
};

export type MonthlyData = {
  month: string;
  household: Household;
  totals: {
    total: number;
    byPerson: Record<string, number>;
  };
  suggestions: string[];
  expenses: Expense[];
};

export type HouseholdInput = {
  personAName: string;
  personBName: string;
};

export type ExpenseInput = {
  spender: string;
  spentOn: string;
  amount: number;
  purpose: string;
};
