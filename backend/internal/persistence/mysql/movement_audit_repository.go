package mysql

import (
	"context"
	"database/sql"
	"fmt"

	"ferreteria/internal/domain"
)

// MovementAuditRepository appends audit rows. It exposes no update or
// delete operation so the trail stays immutable.
type MovementAuditRepository struct {
	database *sql.DB
}

func NewMovementAuditRepository(database *sql.DB) *MovementAuditRepository {
	return &MovementAuditRepository{database: database}
}

func (r *MovementAuditRepository) Append(ctx context.Context, entry *domain.MovementAudit) error {
	const statement = `
		INSERT INTO movement_audit (
			movement_id, changed_at, changed_by,
			old_amount, new_amount, old_note, new_note, action
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := r.database.ExecContext(
		ctx,
		statement,
		entry.MovementID,
		entry.ChangedAt,
		entry.ChangedBy,
		amountDecimalValue(entry.OldAmount),
		amountDecimalValue(entry.NewAmount),
		noteValue(optionalString(entry.OldNote)),
		noteValue(optionalString(entry.NewNote)),
		string(entry.Action),
	)
	if err != nil {
		return fmt.Errorf("insert movement audit: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("read inserted audit id: %w", err)
	}
	entry.ID = id
	return nil
}

func (r *MovementAuditRepository) ListByMovement(
	ctx context.Context,
	movementID int64,
) ([]*domain.MovementAudit, error) {
	const query = `
		SELECT id, movement_id, changed_at, changed_by, action
		FROM movement_audit
		WHERE movement_id = ?
		ORDER BY changed_at, id`

	rows, err := r.database.QueryContext(ctx, query, movementID)
	if err != nil {
		return nil, fmt.Errorf("list movement audit: %w", err)
	}
	defer rows.Close()

	entries := make([]*domain.MovementAudit, 0)
	for rows.Next() {
		var entry domain.MovementAudit
		var action string
		if err := rows.Scan(&entry.ID, &entry.MovementID, &entry.ChangedAt, &entry.ChangedBy, &action); err != nil {
			return nil, fmt.Errorf("scan audit row: %w", err)
		}
		entry.Action = domain.AuditAction(action)
		entries = append(entries, &entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate audit rows: %w", err)
	}
	return entries, nil
}

func amountDecimalValue(amount *domain.Amount) sql.NullString {
	if amount == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: centsToDecimalString(amount.Cents()), Valid: true}
}

func optionalString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}