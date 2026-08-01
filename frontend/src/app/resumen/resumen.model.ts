export type Granularidad = 'daily' | 'weekly' | 'monthly';

export interface Summary {
  start: string;
  end: string;
  total_income_cents: number;
  total_expense_cents: number;
  net_cents: number;
}
