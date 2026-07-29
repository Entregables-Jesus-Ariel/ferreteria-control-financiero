// Package postgres implements the application repository ports on top of
// PostgreSQL. It owns SQL and driver details so no other layer does.
package postgres

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"

	"ferreteria/internal/config"
)

// Pool settings bound how many connections the backend may hold open.
const (
	maxOpenConnections = 25
	maxIdleConnections = 5
	connectionLifetime = 30 * time.Minute
)

// Open builds a connection pool from validated configuration. Credentials
// come from config, never from literals in this package.
func Open(settings config.Config) (*sql.DB, error) {
	dataSource := fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=disable",
		settings.DatabaseHost,
		settings.DatabasePort,
		settings.DatabaseName,
		settings.DatabaseUser,
		settings.DatabasePassword,
	)

	database, err := sql.Open("postgres", dataSource)
	if err != nil {
		return nil, fmt.Errorf("open database connection: %w", err)
	}

	database.SetMaxOpenConns(maxOpenConnections)
	database.SetMaxIdleConns(maxIdleConnections)
	database.SetConnMaxLifetime(connectionLifetime)

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("verify database connection: %w", err)
	}
	return database, nil
}
