package postgres

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

// NewMovementAuditRepository builds the repository.
func NewMovementAuditRepository(database *sql.DB) *MovementAuditRepository {
	return &MovementAuditRepository{database: database}
}

// Append stores one audit entry.
func (r *MovementAuditRepository) Append(ctx context.Context, entry *domain.MovementAudit) error {
	const statement = `
		INSERT INTO movement_audit (
			movement_id, changed_at, changed_by,
			old_amount, new_amount, old_note, new_note, action
		)
		VALUES (
			$1, $2, $3,
			CASE WHEN $4::bigint IS NULL THEN NULL ELSE $4::numeric / 100 END,
			CASE WHEN $5::bigint IS NULL THEN NULL ELSE $5::numeric / 100 END,
			$6, $7, $8
		)
		RETURNING id`

	err := r.database.QueryRowContext(
		ctx,
		statement,
		entry.MovementID,
		entry.ChangedAt,
		entry.ChangedBy,
		amountCentsValue(entry.OldAmount),
		amountCentsValue(entry.NewAmount),
		noteValue(optionalString(entry.OldNote)),
		noteValue(optionalString(entry.NewNote)),
		string(entry.Action),
	).Scan(&entry.ID)
	if err != nil {
		return fmt.Errorf("insert movement audit: %w", err)
	}
	return nil
}

// ListByMovement returns the audit trail of one movement.
func (r *MovementAuditRepository) ListByMovement(
	ctx context.Context,
	movementID int64,
) ([]*domain.MovementAudit, error) {
	const query = `
		SELECT id, movement_id, changed_at, changed_by, action
		FROM movement_audit
		WHERE movement_id = $1
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

func amountCentsValue(amount *domain.Amount) sql.NullInt64 {
	if amount == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: amount.Cents(), Valid: true}
}

func optionalString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
