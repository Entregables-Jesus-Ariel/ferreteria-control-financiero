package postgres

import (
	"database/sql"
	"time"

	"ferreteria/internal/domain"
)

// movementRecord is the persistence shape of a movement row. It exists so
// the domain entity never carries database concerns such as nullable
// columns or driver types.
type movementRecord struct {
	ID          int64
	UserID      int64
	CategoryID  int64
	Date        time.Time
	AmountCents int64
	Note        sql.NullString
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CancelledAt sql.NullTime
}

// toDomain converts a persisted row into a domain entity.
func (r movementRecord) toDomain() *domain.Movement {
	movement := &domain.Movement{
		ID:         r.ID,
		UserID:     r.UserID,
		CategoryID: r.CategoryID,
		Date:       r.Date,
		Amount:     domain.AmountFromCents(r.AmountCents),
		CreatedAt:  r.CreatedAt,
		UpdatedAt:  r.UpdatedAt,
	}
	if r.Note.Valid {
		movement.Note = r.Note.String
	}
	if r.CancelledAt.Valid {
		cancelled := r.CancelledAt.Time
		movement.CancelledAt = &cancelled
	}
	return movement
}

// noteValue converts an optional note into a nullable column value.
func noteValue(note string) sql.NullString {
	if note == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: note, Valid: true}
}

// cancelledValue converts an optional cancellation into a nullable column.
func cancelledValue(cancelledAt *time.Time) sql.NullTime {
	if cancelledAt == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *cancelledAt, Valid: true}
}
