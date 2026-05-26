package service

import (
	"errors"
	"sort"
	"time"

	"go-daily/internal/models"
	"go-daily/internal/repository"
)

// RecordService handles business logic for DailyRecord operations
type RecordService struct {
	repo *repository.RecordRepository
}

// NewRecordService creates a new RecordService instance
func NewRecordService(repo *repository.RecordRepository) *RecordService {
	return &RecordService{repo: repo}
}

// CreateRecord validates and creates a new DailyRecord
func (s *RecordService) CreateRecord(record *models.DailyRecord) error {
	if record.Date == "" {
		return errors.New("date is required")
	}
	if _, err := time.Parse("2006-01-02", record.Date); err != nil {
		return errors.New("date must be in YYYY-MM-DD format")
	}

	// Set defaults
	if record.OverallStatus == "" {
		record.OverallStatus = models.OverallStatusGood
	}
	if record.BreathingStatus == "" {
		record.BreathingStatus = models.BreathingStatusNoWheeze
	}
	if record.SleepPosition == "" {
		record.SleepPosition = models.SleepPositionCan
	}
	if record.AppetiteStatus == "" {
		record.AppetiteStatus = models.AppetiteStatusGood
	}
	if record.VomitStatus == "" {
		record.VomitStatus = models.VomitStatusNone
	}
	if record.MentalStatus == "" {
		record.MentalStatus = models.MentalStatusChatty
	}
	if record.EmotionStatus == "" {
		record.EmotionStatus = models.EmotionStatusStable
	}

	return s.repo.Create(record)
}

// GetRecord retrieves a DailyRecord by ID
func (s *RecordService) GetRecord(id uint) (*models.DailyRecord, error) {
	return s.repo.GetByID(id)
}

// GetTodayRecord retrieves today's record for a given period
func (s *RecordService) GetTodayRecord(period string) (*models.DailyRecord, error) {
	today := time.Now().Format("2006-01-02")
	return s.repo.GetByDateAndPeriod(today, period)
}

// ListRecords returns paginated DailyRecords
func (s *RecordService) ListRecords(page, pageSize int) ([]models.DailyRecord, int64, error) {
	return s.repo.List(page, pageSize, "")
}

// UpdateRecord updates an existing DailyRecord
func (s *RecordService) UpdateRecord(record *models.DailyRecord) error {
	if record.ID == 0 {
		return errors.New("record id is required for update")
	}
	// Preserve the existing date if the payload doesn't include one
	if record.Date == "" {
		existing, err := s.repo.GetByID(record.ID)
		if err != nil {
			return err
		}
		if existing != nil {
			record.Date = existing.Date
		}
	}
	return s.repo.Update(record)
}

// DeleteRecord deletes a DailyRecord by ID
func (s *RecordService) DeleteRecord(id uint) error {
	return s.repo.Delete(id)
}

// UpsertRecord creates or updates a DailyRecord by date and period
func (s *RecordService) UpsertRecord(record *models.DailyRecord) error {
	if record.Date == "" {
		return errors.New("date is required")
	}
	if _, err := time.Parse("2006-01-02", record.Date); err != nil {
		return errors.New("date must be in YYYY-MM-DD format")
	}
	if record.Period != models.PeriodMorning && record.Period != models.PeriodEvening {
		return errors.New("period must be \"morning\" or \"evening\"")
	}
	return s.repo.Upsert(record)
}

// GetAllRecords returns all DailyRecords for export
func (s *RecordService) GetAllRecords() ([]models.DailyRecord, error) {
	return s.repo.ListAll()
}

// RiskAlert represents a health risk alert
type RiskAlert struct {
	Type        string `json:"type"`
	Severity    string `json:"severity"`    // "warning" or "danger"
	Description string `json:"description"`
	Date        string `json:"date"`        // when the alert was triggered
}

// CheckRiskAlerts checks for health risk patterns in recent records
func (s *RecordService) CheckRiskAlerts() ([]RiskAlert, error) {
	records, err := s.repo.ListRecent(7)
	if err != nil {
		return nil, err
	}

	if len(records) < 3 {
		return []RiskAlert{}, nil
	}

	// Sort records by date ascending for sequential analysis
	sort.Slice(records, func(i, j int) bool {
		return records[i].Date < records[j].Date
	})

	alerts := make([]RiskAlert, 0)

	today := time.Now().Format("2006-01-02")

	// Check appetite: good -> little -> none (worsening order)
	if alert := checkTrend(records, "appetite", "warning",
		"连续3天食欲下降，请关注营养状况",
		map[string]int{
			models.AppetiteStatusGood:   0,
			models.AppetiteStatusLittle: 1,
			models.AppetiteStatusNone:   2,
		},
		func(r *models.DailyRecord) string { return r.AppetiteStatus },
		today,
	); alert != nil {
		alerts = append(alerts, *alert)
	}

	// Check breathing: no_wheeze -> walk_wheeze -> sit_wheeze (worsening order)
	if alert := checkTrend(records, "breathing", "warning",
		"连续3天呼吸状况恶化，请及时就医",
		map[string]int{
			models.BreathingStatusNoWheeze:  0,
			models.BreathingStatusWalkWheeze: 1,
			models.BreathingStatusSitWheeze:  2,
		},
		func(r *models.DailyRecord) string { return r.BreathingStatus },
		today,
	); alert != nil {
		alerts = append(alerts, *alert)
	}

	// Check sleep position: can -> half -> cannot (worsening order)
	if alert := checkTrend(records, "sleep_position", "warning",
		"连续3天睡眠姿势恶化，请关注舒适度",
		map[string]int{
			models.SleepPositionCan:    0,
			models.SleepPositionHalf:   1,
			models.SleepPositionCannot: 2,
		},
		func(r *models.DailyRecord) string { return r.SleepPosition },
		today,
	); alert != nil {
		alerts = append(alerts, *alert)
	}

	// Check blood vomiting — danger on any single day
	for _, r := range records {
		if r.HasBloodVomiting {
			alerts = append(alerts, RiskAlert{
				Type:        "blood_vomiting",
				Severity:    "danger",
				Description: "检测到吐血症状，请立即就医",
				Date:        r.Date,
			})
		}
	}

	// Check black stool — danger on any single day
	for _, r := range records {
		if r.HasBlackStool {
			alerts = append(alerts, RiskAlert{
				Type:        "black_stool",
				Severity:    "danger",
				Description: "检测到黑便症状，请立即就医",
				Date:        r.Date,
			})
		}
	}

	return alerts, nil
}

// checkTrend checks if there are 3+ consecutive days with strictly worsening status
func checkTrend(
	records []models.DailyRecord,
	alertType, severity, description string,
	statusMap map[string]int,
	getStatus func(*models.DailyRecord) string,
	today string,
) *RiskAlert {
	consecutiveCount := 1
	for i := 1; i < len(records); i++ {
		prevVal, prevOk := statusMap[getStatus(&records[i-1])]
		currVal, currOk := statusMap[getStatus(&records[i])]

		if prevOk && currOk && currVal > prevVal {
			consecutiveCount++
		} else {
			consecutiveCount = 1
		}

		if consecutiveCount >= 3 {
			return &RiskAlert{
				Type:        alertType,
				Severity:    severity,
				Description: description,
				Date:        records[i].Date,
			}
		}
	}
	return nil
}