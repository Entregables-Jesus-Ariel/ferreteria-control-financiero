package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"ferreteria/internal/application/port"
	"ferreteria/internal/domain"
)

// MovementRepository stores movements in PostgreSQL. Every statement is
// parameterized, so user input never reaches the query text.
type MovementRepository struct {
	database *sql.DB
}

// NewMovementRepository builds the repository.
func NewMovementRepository(database *sql.DB) *MovementRepository {
	return &MovementRepository{database: database}
}

// Create inserts a movement and returns it with its generated identifier.
func (r *MovementRepository) Create(ctx context.Context, movement *domain.Movement) (*domain.Movement, error) {
	const statement = `
		INSERT INTO movement (user_id, category_id, date, amount, note, created_at, updated_at)
		VALUES ($1, $2, $3, $4::numeric / 100, $5, $6, $7)
		RETURNING id`

	err := r.database.QueryRowContext(
		ctx,
		statement,
		movement.UserID,
		movement.CategoryID,
		movement.Date,
		movement.Amount.Cents(),
		noteValue(movement.Note),
		movement.CreatedAt,
		movement.UpdatedAt,
	).Scan(&movement.ID)
	if err != nil {
		return nil, fmt.Errorf("insert movement: %w", err)
	}
	return movement, nil
}

// Update writes the current state of a movement, including cancellation.
func (r *MovementRepository) Update(ctx context.Context, movement *domain.Movement) error {
	const statement = `
		UPDATE movement
		SET category_id = $2, date = $3, amount = $4::numeric / 100,
		    note = $5, updated_at = $6, cancelled_at = $7
		WHERE id = $1`

	result, err := r.database.ExecContext(
		ctx,
		statement,
		movement.ID,
		movement.CategoryID,
		movement.Date,
		movement.Amount.Cents(),
		noteValue(movement.Note),
		movement.UpdatedAt,
		cancelledValue(movement.CancelledAt),
	)
	if err != nil {
		return fmt.Errorf("update movement: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("inspect update result: %w", err)
	}
	if affected == 0 {
		return domain.ErrMovementNotFound
	}
	return nil
}

// FindByID returns one movement.
func (r *MovementRepository) FindByID(ctx context.Context, id int64) (*domain.Movement, error) {
	const query = `
		SELECT id, user_id, category_id, date, (amount * 100)::bigint,
		       note, created_at, updated_at, cancelled_at
		FROM movement
		WHERE id = $1`

	var record movementRecord
	err := r.database.QueryRowContext(ctx, query, id).Scan(
		&record.ID,
		&record.UserID,
		&record.CategoryID,
		&record.Date,
		&record.AmountCents,
		&record.Note,
		&record.CreatedAt,
		&record.UpdatedAt,
		&record.CancelledAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrMovementNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("select movement: %w", err)
	}
	return record.toDomain(), nil
}

// List returns the movements of a period, newest first.
func (r *MovementRepository) List(ctx context.Context, filter port.MovementFilter) ([]*domain.Movement, error) {
	const query = `
		SELECT id, user_id, category_id, date, (amount * 100)::bigint,
		       note, created_at, updated_at, cancelled_at
		FROM movement
		WHERE date BETWEEN $1 AND $2
		  AND ($3 = 0 OR category_id = $3)
		  AND ($4 OR cancelled_at IS NULL)
		ORDER BY date DESC, id DESC
		LIMIT $5 OFFSET $6`

	rows, err := r.database.QueryContext(
		ctx,
		query,
		filter.Period.Start,
		filter.Period.End,
		filter.CategoryID,
		filter.IncludeCancelled,
		filter.Limit,
		filter.Offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list movements: %w", err)
	}
	defer rows.Close()

	movements := make([]*domain.Movement, 0)
	for rows.Next() {
		var record movementRecord
		if err := rows.Scan(
			&record.ID,
			&record.UserID,
			&record.CategoryID,
			&record.Date,
			&record.AmountCents,
			&record.Note,
			&record.CreatedAt,
			&record.UpdatedAt,
			&record.CancelledAt,
		); err != nil {
			return nil, fmt.Errorf("scan movement row: %w", err)
		}
		movements = append(movements, record.toDomain())
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate movement rows: %w", err)
	}
	return movements, nil
}

// TotalsByCategoryType aggregates amounts per category type, excluding
// cancelled movements so they never affect a balance.
func (r *MovementRepository) TotalsByCategoryType(
	ctx context.Context,
	period domain.Period,
) ([]port.CategoryTotal, error) {
	const query = `
		SELECT category.type, COALESCE(SUM(movement.amount) * 100, 0)::bigint
		FROM movement
		JOIN category ON category.id = movement.category_id
		WHERE movement.date BETWEEN $1 AND $2
		  AND movement.cancelled_at IS NULL
		GROUP BY category.type`

	rows, err := r.database.QueryContext(ctx, query, period.Start, period.End)
	if err != nil {
		return nil, fmt.Errorf("aggregate movement totals: %w", err)
	}
	defer rows.Close()

	totals := make([]port.CategoryTotal, 0, 2)
	for rows.Next() {
		var categoryType string
		var cents int64
		if err := rows.Scan(&categoryType, &cents); err != nil {
			return nil, fmt.Errorf("scan total row: %w", err)
		}
		totals = append(totals, port.CategoryTotal{
			Type:  domain.CategoryType(categoryType),
			Cents: cents,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate total rows: %w", err)
	}
	return totals, nil
}
