package ai

import (
	"sort"

	"go-daily/internal/models"
	"go-daily/internal/repository"
	"go-daily/internal/service"
)

// AIService orchestrates AI analysis features.
type AIService struct {
	repo       *repository.RecordRepository
	configSvc  *service.ConfigService
	riskEngine *RiskEngine
}

// NewAIService creates a new AIService instance.
func NewAIService(repo *repository.RecordRepository, configSvc *service.ConfigService) *AIService {
	return &AIService{
		repo:       repo,
		configSvc:  configSvc,
		riskEngine: NewRiskEngine(),
	}
}

// GetSummary returns a SummaryResult based on recent records.
func (s *AIService) GetSummary() (*SummaryResult, error) {
	records, err := s.repo.ListRecent(7)
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return &SummaryResult{
			PatientStatus: PatientStatus{
				OverallTrend: "insufficient_data",
				RiskLevel:    "unknown",
				KeyChanges:   []string{},
			},
			WarningSignals: []string{},
		}, nil
	}
	return s.riskEngine.BuildSummary(records), nil
}

// GetContext returns a ContextResult for LLM prompt building.
// It fetches the last 7 days of records, reads patient profile from settings, and computes trends.
func (s *AIService) GetContext() (*ContextResult, error) {
	records, err := s.repo.ListRecent(7)
	if err != nil {
		return nil, err
	}

	// Read patient profile from settings
	profile := PatientProfile{
		Name:      "母亲",
		BasicInfo: "",
	}
	if settings, err := s.configSvc.GetSettings(); err == nil {
		if settings.PatientName != "" {
			profile.Name = settings.PatientName
		}
		profile.BasicInfo = settings.BasicInfo
	}

	// Sort by date ascending for trend analysis
	sorted := make([]models.DailyRecord, len(records))
	copy(sorted, records)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Date < sorted[j].Date
	})

	// Build recent records summary
	recentRecords := make([]RecordSummary, 0, len(sorted))
	for _, r := range sorted {
		recentRecords = append(recentRecords, RecordSummary{
			Date:            r.Date,
			OverallStatus:   r.OverallStatus,
			BreathingStatus: r.BreathingStatus,
			AppetiteStatus:  r.AppetiteStatus,
			VomitStatus:     r.VomitStatus,
			DialysisPhase:   r.DialysisPhase,
			Notes:           r.Notes,
		})
	}

	// Compute trends
	breathingTrend := s.riskEngine.AnalyzeTrend(sorted, BreathingValues, func(r *models.DailyRecord) string { return r.BreathingStatus })
	appetiteTrend := s.riskEngine.AnalyzeTrend(sorted, AppetiteValues, func(r *models.DailyRecord) string { return r.AppetiteStatus })
	sleepTrend := s.riskEngine.AnalyzeTrend(sorted, SleepValues, func(r *models.DailyRecord) string { return r.SleepPosition })

	return &ContextResult{
		PatientProfile: profile,
		RecentRecords:  recentRecords,
		TrendAnalysis: TrendAnalysis{
			Breathing:     breathingTrend,
			Appetite:      appetiteTrend,
			SleepPosition: sleepTrend,
		},
	}, nil
}

// GetRiskScore returns a RiskScoreResult based on recent records.
func (s *AIService) GetRiskScore() (*RiskScoreResult, error) {
	records, err := s.repo.ListRecent(7)
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return &RiskScoreResult{RiskScore: 0, RiskLevel: "low", Factors: []RiskFactor{}}, nil
	}
	return s.riskEngine.CalculateRiskScore(records), nil
}