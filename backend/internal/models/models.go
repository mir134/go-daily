package models

import (
	"errors"
	"time"
)

// Status constants
const (
	// OverallStatus
	OverallStatusGood         = "good"
	OverallStatusNormal       = "normal"
	OverallStatusUncomfortable = "uncomfortable"
	OverallStatusSevere       = "severe"

	// BreathingStatus
	BreathingStatusNoWheeze  = "no_wheeze"
	BreathingStatusWalkWheeze = "walk_wheeze"
	BreathingStatusSitWheeze  = "sit_wheeze"

	// SleepPosition
	SleepPositionCan    = "can"
	SleepPositionHalf   = "half"
	SleepPositionCannot = "cannot"

	// AppetiteStatus
	AppetiteStatusGood  = "good"
	AppetiteStatusLittle = "little"
	AppetiteStatusNone  = "none"

	// VomitStatus
	VomitStatusNone  = "none"
	VomitStatusNausea = "nausea"
	VomitStatusVomit  = "vomit"
	VomitStatusBlood  = "blood"

	// MentalStatus
	MentalStatusChatty  = "chatty"
	MentalStatusListless = "listless"
	MentalStatusSleepy  = "sleepy"

	// EmotionStatus
	EmotionStatusStable  = "stable"
	EmotionStatusAgitated = "agitated"
	EmotionStatusQuarrel = "quarrel"

	// DialysisPhase
	DialysisPhaseNonDialysis     = "non_dialysis"
	DialysisPhaseHemodialysis    = "hemodialysis"
	DialysisPhasePerfusion       = "perfusion"
	DialysisPhaseHemofiltration   = "hemofiltration"

	// Period
	PeriodMorning = "morning"
	PeriodEvening = "evening"
)

// DailyRecord represents a health record for a specific day
type DailyRecord struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	Date                 string    `gorm:"uniqueIndex:idx_date_period;size:10" json:"date"`
	Period               string    `gorm:"uniqueIndex:idx_date_period;size:10" json:"period"`
	OverallStatus        string    `gorm:"size:20" json:"overall_status"`
	BreathingStatus      string    `gorm:"size:20" json:"breathing_status"`
	SleepPosition        string    `gorm:"size:20" json:"sleep_position"`
	AppetiteStatus       string    `gorm:"size:20" json:"appetite_status"`
	VomitStatus          string    `gorm:"size:20" json:"vomit_status"`
	MentalStatus         string    `gorm:"size:20" json:"mental_status"`
	EmotionStatus        string    `gorm:"size:20" json:"emotion_status"`
	IsDialysisDay        bool      `json:"is_dialysis_day"`
	DialysisPhase        string    `gorm:"size:20" json:"dialysis_phase"`
	PreWeight            *float64  `json:"pre_weight"`
	PostWeight           *float64  `json:"post_weight"`
	UltrafiltrationVolume *float64 `json:"ultrafiltration_volume"`
	BloodPressure        string    `gorm:"size:20" json:"blood_pressure"`
	OxygenSaturation     *int      `json:"oxygen_saturation"`
	BloodSugar           *float64  `json:"blood_sugar"`
	HasBlackStool        bool      `json:"has_black_stool"`
	HasBloodVomiting     bool      `json:"has_blood_vomiting"`
	Notes                string    `gorm:"size:500" json:"notes"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// AppConfig represents application configuration settings
type AppConfig struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Key   string `gorm:"uniqueIndex;size:50" json:"key"`
	Value string `gorm:"size:500" json:"value"`
}

// Validate checks required fields for DailyRecord
func (d *DailyRecord) Validate() error {
	if d.Date == "" {
		return errors.New("date is required")
	}
	if d.OverallStatus == "" {
		return errors.New("overall_status is required")
	}
	return nil
}