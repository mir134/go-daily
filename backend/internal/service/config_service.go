package service

import (
	"go-daily/internal/repository"
)

// Settings represents all user-configurable application settings.
type Settings struct {
	PatientName     string `json:"patient_name"`
	BasicInfo       string `json:"basic_info"`
	DialysisEnabled bool   `json:"dialysis_enabled"`
	DryWeight       string `json:"dry_weight"`
	Notes           string `json:"notes"`
}

// ConfigService handles business logic for app configuration.
type ConfigService struct {
	repo *repository.AppConfigRepository
}

// NewConfigService creates a new ConfigService instance.
func NewConfigService(repo *repository.AppConfigRepository) *ConfigService {
	return &ConfigService{repo: repo}
}

// GetSettings retrieves all settings from the database.
func (s *ConfigService) GetSettings() (*Settings, error) {
	patientName, _ := s.repo.Get("patient_name")
	basicInfo, _ := s.repo.Get("basic_info")
	dialysisStr, _ := s.repo.Get("dialysis_enabled")
	dryWeight, _ := s.repo.Get("dry_weight")
	notes, _ := s.repo.Get("notes")

	return &Settings{
		PatientName:     patientName,
		BasicInfo:       basicInfo,
		DialysisEnabled: dialysisStr == "true",
		DryWeight:       dryWeight,
		Notes:           notes,
	}, nil
}

// SaveSettings persists all settings to the database.
func (s *ConfigService) SaveSettings(settings *Settings) error {
	if err := s.repo.Set("patient_name", settings.PatientName); err != nil {
		return err
	}
	if err := s.repo.Set("basic_info", settings.BasicInfo); err != nil {
		return err
	}
	dialysisVal := "false"
	if settings.DialysisEnabled {
		dialysisVal = "true"
	}
	if err := s.repo.Set("dialysis_enabled", dialysisVal); err != nil {
		return err
	}
	if err := s.repo.Set("dry_weight", settings.DryWeight); err != nil {
		return err
	}
	if err := s.repo.Set("notes", settings.Notes); err != nil {
		return err
	}
	return nil
}
