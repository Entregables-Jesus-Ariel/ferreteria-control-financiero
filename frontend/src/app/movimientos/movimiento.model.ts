export interface Movement {
  id: number;
  category_id: number;
  date: string;
  amount_cents: number;
  note: string;
  cancelled: boolean;
}

export interface CreateMovementRequest {
  category_id: number;
  date: string;
  amount_cents: number;
  note: string;
}
