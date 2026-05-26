package database

import (
	"fmt"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"go.uber.org/zap"

	"go-daily/internal/models"
)

// Init opens a SQLite connection with WAL mode and connection pool configuration
func Init(dsn string, logger *zap.Logger) (*gorm.DB, error) {
	// Create data directory if it doesn't exist
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		if err := os.Mkdir("data", 0755); err != nil {
			return nil, err
		}
		logger.Info("Created data directory", zap.String("path", "data"))
	}

	// Enable WAL mode for better concurrency
	dsn += "?_pragma=journal_mode=WAL"

	// Open SQLite connection
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default,
	})
	if err != nil {
		return nil, err
	}

	// Configure connection pool (SQLite doesn't support concurrent writes)
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Set max connections (only 1 for SQLite)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetMaxOpenConns(1)

	// Log database path
	logger.Info("Database connection established", zap.String("path", dsn))

	return db, nil
}

// AutoMigrate runs GORM auto-migration for all models
func AutoMigrate(db *gorm.DB) error {
	// Drop any old unique index on date (from previous schema before period support).
	// GORM AutoMigrate does not drop existing indexes, so we do it manually.
	// The old GORM auto-generated name varies, so we query sqlite_master directly.
	type idxRow struct {
		Name string
	}
	var indexes []idxRow
	if err := db.Raw("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='daily_records' AND sql LIKE '%UNIQUE%' AND name != 'idx_date_period'").Scan(&indexes).Error; err != nil {
		return fmt.Errorf("query old indexes: %w", err)
	}
	for _, idx := range indexes {
		if err := db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS \"%s\"", idx.Name)).Error; err != nil {
			return fmt.Errorf("drop old index %s: %w", idx.Name, err)
		}
	}

	// Auto-migrate models
	if err := db.AutoMigrate(&models.DailyRecord{}); err != nil {
		return err
	}

	if err := db.AutoMigrate(&models.AppConfig{}); err != nil {
		return err
	}

	return nil
}