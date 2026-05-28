package repository

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"go-daily/internal/models"
)

// RecordRepository handles CRUD operations for DailyRecord
type RecordRepository struct {
	db *gorm.DB
}

// NewRecordRepository creates a new RecordRepository instance
func NewRecordRepository(db *gorm.DB) *RecordRepository {
	return &RecordRepository{db: db}
}

// Create inserts a new DailyRecord. Returns error if date and period already exist.
func (r *RecordRepository) Create(record *models.DailyRecord) error {
	// Check if record with same date and period exists
	var existing models.DailyRecord
	result := r.db.Where("date = ? AND period = ?", record.Date, record.Period).First(&existing)
	if result.Error == nil {
		return errors.New("record with this date and period already exists")
	}
	if result.Error != gorm.ErrRecordNotFound {
		return result.Error
	}

	// Create new record
	return r.db.Create(record).Error
}

// GetByID retrieves a DailyRecord by ID
func (r *RecordRepository) GetByID(id uint) (*models.DailyRecord, error) {
	var record models.DailyRecord
	result := r.db.First(&record, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &record, nil
}

// GetByDateAndPeriod retrieves a DailyRecord by date and period
func (r *RecordRepository) GetByDateAndPeriod(date, period string) (*models.DailyRecord, error) {
	var record models.DailyRecord
	result := r.db.Where("date = ? AND period = ?", date, period).First(&record)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &record, nil
}

// List returns paginated DailyRecords sorted by date desc
// Returns records, total count, and error
func (r *RecordRepository) List(page, pageSize int, sort string) ([]models.DailyRecord, int64, error) {
	var records []models.DailyRecord
	var total int64

	// Count total records
	if err := r.db.Model(&models.DailyRecord{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Default sort by date desc, period desc (morning before evening on same day)
	if sort == "" {
		sort = "date desc, period desc"
	}

	// Calculate offset
	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	// Query with pagination and sorting
	result := r.db.Order(sort).Limit(pageSize).Offset(offset).Find(&records)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return records, total, nil
}

// Update updates an existing DailyRecord
func (r *RecordRepository) Update(record *models.DailyRecord) error {
	return r.db.Save(record).Error
}

// Delete deletes a DailyRecord by ID
func (r *RecordRepository) Delete(id uint) error {
	return r.db.Delete(&models.DailyRecord{}, id).Error
}

// Upsert creates or updates a DailyRecord by date and period
// Uses FirstOrCreate with Where and Assign pattern
func (r *RecordRepository) Upsert(record *models.DailyRecord) error {
	var existing models.DailyRecord
	err := r.db.Where("date = ? AND period = ?", record.Date, record.Period).Assign(record).FirstOrCreate(&existing).Error
	if err != nil {
		return err
	}
	// FirstOrCreate stores the result (including the ID) in `existing`,
	// but the caller expects the ID on the passed `record` pointer.
	record.ID = existing.ID
	return nil
}

// ListAll returns all DailyRecords for export
func (r *RecordRepository) ListAll() ([]models.DailyRecord, error) {
	var records []models.DailyRecord
	result := r.db.Order("date desc, period desc").Find(&records)
	if result.Error != nil {
		return nil, result.Error
	}
	return records, nil
}

// ListRecent returns DailyRecords from the last N days (inclusive of today).
// Unlike the name suggests, this queries by date range, not limiting to N records.
// This ensures all morning/evening records within the period are returned.
func (r *RecordRepository) ListRecent(days int) ([]models.DailyRecord, error) {
	var records []models.DailyRecord
	cutoff := time.Now().AddDate(0, 0, -days+1).Format("2006-01-02")
	result := r.db.Where("date >= ?", cutoff).Order("date desc").Find(&records)
	if result.Error != nil {
		return nil, result.Error
	}
	return records, nil
}

// AppConfigRepository handles key-value configuration operations
type AppConfigRepository struct {
	db *gorm.DB
}

// NewAppConfigRepository creates a new AppConfigRepository instance
func NewAppConfigRepository(db *gorm.DB) *AppConfigRepository {
	return &AppConfigRepository{db: db}
}

// Get retrieves a configuration value by key
func (r *AppConfigRepository) Get(key string) (string, error) {
	var config models.AppConfig
	result := r.db.Where("key = ?", key).First(&config)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", result.Error
	}
	return config.Value, nil
}

// Set creates or updates a configuration key-value pair
func (r *AppConfigRepository) Set(key, value string) error {
	var existing models.AppConfig
	return r.db.Where("key = ?", key).Assign(models.AppConfig{Key: key, Value: value}).FirstOrCreate(&existing).Error
}