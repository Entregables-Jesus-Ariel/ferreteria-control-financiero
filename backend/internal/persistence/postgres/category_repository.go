package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"ferreteria/internal/domain"
)

// CategoryRepository stores categories in PostgreSQL.
type CategoryRepository struct {
	database *sql.DB
}

// NewCategoryRepository builds the repository.
func NewCategoryRepository(database *sql.DB) *CategoryRepository {
	return &CategoryRepository{database: database}
}

// Create inserts a category and returns it with its identifier.
func (r *CategoryRepository) Create(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	const statement = `
		INSERT INTO category (name, type, created_at)
		VALUES ($1, $2, $3)
		RETURNING id`

	err := r.database.QueryRowContext(
		ctx,
		statement,
		category.Name,
		string(category.Type),
		category.CreatedAt,
	).Scan(&category.ID)
	if err != nil {
		return nil, fmt.Errorf("insert category: %w", err)
	}
	return category, nil
}

// FindByID returns one category.
func (r *CategoryRepository) FindByID(ctx context.Context, id int64) (*domain.Category, error) {
	const query = `SELECT id, name, type, created_at FROM category WHERE id = $1`
	return r.queryOne(ctx, query, id)
}

// FindByName returns one category by its unique name.
func (r *CategoryRepository) FindByName(ctx context.Context, name string) (*domain.Category, error) {
	const query = `SELECT id, name, type, created_at FROM category WHERE name = $1`
	return r.queryOne(ctx, query, name)
}

// ListByType returns the categories of one type.
func (r *CategoryRepository) ListByType(
	ctx context.Context,
	categoryType domain.CategoryType,
) ([]*domain.Category, error) {
	const query = `
		SELECT id, name, type, created_at
		FROM category
		WHERE type = $1
		ORDER BY name`
	return r.queryMany(ctx, query, string(categoryType))
}

// ListAll returns every category ordered by name.
func (r *CategoryRepository) ListAll(ctx context.Context) ([]*domain.Category, error) {
	const query = `SELECT id, name, type, created_at FROM category ORDER BY name`
	return r.queryMany(ctx, query)
}

func (r *CategoryRepository) queryOne(
	ctx context.Context,
	query string,
	argument any,
) (*domain.Category, error) {
	var category domain.Category
	var categoryType string
	err := r.database.QueryRowContext(ctx, query, argument).Scan(
		&category.ID,
		&category.Name,
		&categoryType,
		&category.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrCategoryNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("select category: %w", err)
	}
	category.Type = domain.CategoryType(categoryType)
	return &category, nil
}

func (r *CategoryRepository) queryMany(
	ctx context.Context,
	query string,
	arguments ...any,
) ([]*domain.Category, error) {
	rows, err := r.database.QueryContext(ctx, query, arguments...)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	categories := make([]*domain.Category, 0)
	for rows.Next() {
		var category domain.Category
		var categoryType string
		if err := rows.Scan(&category.ID, &category.Name, &categoryType, &category.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan category row: %w", err)
		}
		category.Type = domain.CategoryType(categoryType)
		categories = append(categories, &category)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate category rows: %w", err)
	}
	return categories, nil
}
