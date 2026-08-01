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

export interface MovementAudit {
  id: number;
  movement_id: number;
  changed_at: string;
  changed_by: number;
  action: 'create' | 'update' | 'delete';
  old_amount_cents?: number;
  new_amount_cents?: number;
  old_note?: string;
  new_note?: string;
}
