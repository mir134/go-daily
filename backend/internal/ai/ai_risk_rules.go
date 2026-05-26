package ai

import (
	"sort"

	"go-daily/internal/models"
)

// --- Numeric Mappings for AI ---
var AppetiteValues = map[string]int{"good": 1, "little": 2, "none": 3}
var BreathingValues = map[string]int{"no_wheeze": 1, "walk_wheeze": 2, "sit_wheeze": 3}
var SleepValues = map[string]int{"can": 1, "half": 2, "cannot": 3}

// --- Shared Types ---

// RiskFactor represents a single risk scoring factor with its name and contribution.
type RiskFactor struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
}

// RiskScoreResult holds the composite risk score, level, and contributing factors.
type RiskScoreResult struct {
	RiskScore int          `json:"risk_score"`
	RiskLevel string       `json:"risk_level"` // "low" | "medium" | "high"
	Factors   []RiskFactor `json:"factors"`
}

// SummaryResult aggregates patient status, dialysis, nutrition, and warning signals.
type SummaryResult struct {
	PatientStatus     PatientStatus     `json:"patient_status"`
	DialysisAnalysis  DialysisAnalysis  `json:"dialysis_analysis"`
	NutritionAnalysis NutritionAnalysis `json:"nutrition_analysis"`
	WarningSignals    []string          `json:"warning_signals"`
}

// PatientStatus describes the overall patient trend, risk level, and key changes.
type PatientStatus struct {
	OverallTrend string   `json:"overall_trend"` // "improving" | "stable" | "declining" | "insufficient_data"
	RiskLevel    string   `json:"risk_level"`    // "low" | "medium" | "high" | "unknown"
	KeyChanges   []string `json:"key_changes"`
}

// DialysisAnalysis captures whether pre-dialysis is worsening and post-dialysis improving.
type DialysisAnalysis struct {
	PreDialysisWorse     bool `json:"pre_dialysis_worse"`
	PostDialysisImproved bool `json:"post_dialysis_improved"`
}

// NutritionAnalysis tracks the appetite trend over time.
type NutritionAnalysis struct {
	AppetiteTrend string `json:"appetite_trend"` // "improving" | "stable" | "declining" | "insufficient_data"
}

// ContextResult provides a rich context snapshot including patient profile, recent records, and trends.
type ContextResult struct {
	PatientProfile PatientProfile  `json:"patient_profile"`
	RecentRecords  []RecordSummary `json:"recent_records"`
	TrendAnalysis  TrendAnalysis   `json:"trend_analysis"`
}

// PatientProfile holds basic patient information.
type PatientProfile struct {
	Name       string   `json:"name"`
	Conditions []string `json:"conditions"`
}

// RecordSummary is a condensed view of a single record for display.
type RecordSummary struct {
	Date            string `json:"date"`
	OverallStatus   string `json:"overall_status"`
	BreathingStatus string `json:"breathing_status"`
	AppetiteStatus  string `json:"appetite_status"`
	VomitStatus     string `json:"vomit_status"`
	DialysisPhase   string `json:"dialysis_phase"`
	Notes           string `json:"notes"`
}

// TrendAnalysis summarizes the direction of key health indicators.
type TrendAnalysis struct {
	Breathing     string `json:"breathing"`      // "improving" | "stable" | "declining" | "unstable" | "insufficient_data"
	Appetite      string `json:"appetite"`       // "improving" | "stable" | "declining" | "unstable" | "insufficient_data"
	SleepPosition string `json:"sleep_position"` // "improving" | "stable" | "declining" | "unstable" | "insufficient_data"
}

// RiskEngine evaluates health records for risk scoring, trend analysis, and summary generation.
type RiskEngine struct{}

// NewRiskEngine creates a new RiskEngine instance.
func NewRiskEngine() *RiskEngine {
	return &RiskEngine{}
}

// CalculateRiskScore evaluates all risk rules against records and returns a scored result.
//
// Scoring rules:
//   - Consecutive worsening in appetite (2+ days): +20 per factor
//   - Consecutive worsening in breathing (2+ days): +25 per factor
//   - Consecutive worsening in sleep (2+ days): +30 per factor
//   - Any vomit=blood: +30 (immediate high)
//   - Any blood_vomiting flag: +30 (immediate high)
//   - Any black_stool flag: +30 (immediate high)
//
// Thresholds: 0-29 low, 30-59 medium, 60+ high.
func (e *RiskEngine) CalculateRiskScore(records []models.DailyRecord) *RiskScoreResult {
	if len(records) == 0 {
		return &RiskScoreResult{RiskScore: 0, RiskLevel: "low", Factors: []RiskFactor{}}
	}

	// Sort records by date ascending for sequential analysis
	sorted := make([]models.DailyRecord, len(records))
	copy(sorted, records)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Date < sorted[j].Date
	})

	factors := []RiskFactor{}
	totalScore := 0

	// Check appetite consecutive worsening (2+ days)
	if hasConsecutiveWorsening(sorted, AppetiteValues, func(r *models.DailyRecord) string { return r.AppetiteStatus }) {
		factors = append(factors, RiskFactor{Name: "appetite_decline", Score: 20})
		totalScore += 20
	}

	// Check breathing consecutive worsening (2+ days)
	if hasConsecutiveWorsening(sorted, BreathingValues, func(r *models.DailyRecord) string { return r.BreathingStatus }) {
		factors = append(factors, RiskFactor{Name: "breathing_decline", Score: 25})
		totalScore += 25
	}

	// Check sleep consecutive worsening (2+ days)
	if hasConsecutiveWorsening(sorted, SleepValues, func(r *models.DailyRecord) string { return r.SleepPosition }) {
		factors = append(factors, RiskFactor{Name: "sleep_decline", Score: 30})
		totalScore += 30
	}

	// Check immediate high-risk flags per record
	for _, r := range sorted {
		if r.VomitStatus == models.VomitStatusBlood {
			factors = append(factors, RiskFactor{Name: "vomit_blood", Score: 30})
			totalScore += 30
		}
		if r.HasBloodVomiting {
			factors = append(factors, RiskFactor{Name: "blood_vomiting", Score: 30})
			totalScore += 30
		}
		if r.HasBlackStool {
			factors = append(factors, RiskFactor{Name: "black_stool", Score: 30})
			totalScore += 30
		}
	}

	// Determine risk level
	riskLevel := "low"
	if totalScore >= 60 {
		riskLevel = "high"
	} else if totalScore >= 30 {
		riskLevel = "medium"
	}

	return &RiskScoreResult{
		RiskScore: totalScore,
		RiskLevel: riskLevel,
		Factors:   factors,
	}
}

// AnalyzeTrend determines if a status field is improving, stable, declining, unstable,
// or has insufficient data over the given records. Uses the last 3-7 records for detection.
func (e *RiskEngine) AnalyzeTrend(records []models.DailyRecord, valueMap map[string]int, getStatus func(*models.DailyRecord) string) string {
	if len(records) < 2 {
		return "insufficient_data"
	}

	// Sort by date ascending
	sorted := make([]models.DailyRecord, len(records))
	copy(sorted, records)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Date < sorted[j].Date
	})

	// Take last 3-7 records
	start := 0
	if len(sorted) > 7 {
		start = len(sorted) - 7
	}
	window := sorted[start:]

	if len(window) < 2 {
		return "insufficient_data"
	}

	// Count directional changes across the window
	declining := 0
	improving := 0
	for i := 1; i < len(window); i++ {
		prevVal, prevOk := valueMap[getStatus(&window[i-1])]
		currVal, currOk := valueMap[getStatus(&window[i])]
		if prevOk && currOk {
			if currVal > prevVal {
				declining++
			} else if currVal < prevVal {
				improving++
			}
		}
	}

	// Check the last 2-3 record transitions for final trend signal
	lastStart := len(window) - 3
	if lastStart < 1 {
		lastStart = 1
	}
	lastDeclining := 0
	lastImproving := 0
	for i := lastStart; i < len(window); i++ {
		prevVal, prevOk := valueMap[getStatus(&window[i-1])]
		currVal, currOk := valueMap[getStatus(&window[i])]
		if prevOk && currOk {
			if currVal > prevVal {
				lastDeclining++
			} else if currVal < prevVal {
				lastImproving++
			}
		}
	}

	// Prioritize recent signals for the final decision
	if lastDeclining > lastImproving {
		return "declining"
	}
	if lastImproving > lastDeclining {
		return "improving"
	}

	if declining > improving {
		return "declining"
	}
	if improving > declining {
		return "improving"
	}
	if declining == 0 && improving == 0 {
		return "stable"
	}
	return "unstable"
}

// AnalyzeDialysis compares pre/post dialysis status across records.
// Returns whether pre-dialysis is worsening and post-dialysis is improving.
func (e *RiskEngine) AnalyzeDialysis(records []models.DailyRecord) DialysisAnalysis {
	result := DialysisAnalysis{}
	var preScores, postScores []int

	for _, r := range records {
		if !r.IsDialysisDay {
			continue
		}
		// Composite health score: higher = worse
		score := AppetiteValues[r.AppetiteStatus] + BreathingValues[r.BreathingStatus] + SleepValues[r.SleepPosition]
		switch r.DialysisPhase {
		case models.DialysisPhasePre:
			preScores = append(preScores, score)
		case models.DialysisPhasePost:
			postScores = append(postScores, score)
		}
	}

	// Pre-dialysis is worsening if the latest score is higher than the earliest
	if len(preScores) >= 2 && preScores[len(preScores)-1] > preScores[0] {
		result.PreDialysisWorse = true
	}
	// Post-dialysis is improving if the latest score is lower than the earliest
	if len(postScores) >= 2 && postScores[len(postScores)-1] < postScores[0] {
		result.PostDialysisImproved = true
	}

	return result
}

// GetWarningSignals checks for critical flags in recent records.
func (e *RiskEngine) GetWarningSignals(records []models.DailyRecord) []string {
	signals := []string{}
	for _, r := range records {
		if r.VomitStatus == models.VomitStatusBlood {
			signals = append(signals, "呕吐带血 ("+r.Date+")")
		}
		if r.HasBloodVomiting {
			signals = append(signals, "吐血 ("+r.Date+")")
		}
		if r.HasBlackStool {
			signals = append(signals, "黑便 ("+r.Date+")")
		}
		if r.OverallStatus == models.OverallStatusSevere {
			signals = append(signals, "整体状况严重 ("+r.Date+")")
		}
	}
	return signals
}

// BuildSummary generates a SummaryResult from the given records.
func (e *RiskEngine) BuildSummary(records []models.DailyRecord) *SummaryResult {
	riskResult := e.CalculateRiskScore(records)
	dialysis := e.AnalyzeDialysis(records)
	appetiteTrend := e.AnalyzeTrend(records, AppetiteValues, func(r *models.DailyRecord) string { return r.AppetiteStatus })
	warnings := e.GetWarningSignals(records)

	// Determine patient status trend from the overall status field
	overallTrend := e.AnalyzeTrend(records, map[string]int{
		models.OverallStatusGood:         1,
		models.OverallStatusNormal:       2,
		models.OverallStatusUncomfortable: 3,
		models.OverallStatusSevere:       4,
	}, func(r *models.DailyRecord) string { return r.OverallStatus })

	// Collect key changes
	keyChanges := []string{}
	for _, f := range riskResult.Factors {
		switch f.Name {
		case "appetite_decline":
			keyChanges = append(keyChanges, "食欲持续下降")
		case "breathing_decline":
			keyChanges = append(keyChanges, "呼吸状况持续恶化")
		case "sleep_decline":
			keyChanges = append(keyChanges, "睡眠姿势持续恶化")
		case "vomit_blood", "blood_vomiting":
			keyChanges = append(keyChanges, "吐血/呕吐带血")
		case "black_stool":
			keyChanges = append(keyChanges, "黑便")
		}
	}

	riskLevel := "unknown"
	switch riskResult.RiskLevel {
	case "low":
		riskLevel = "low"
	case "medium":
		riskLevel = "medium"
	case "high":
		riskLevel = "high"
	}

	return &SummaryResult{
		PatientStatus: PatientStatus{
			OverallTrend: overallTrend,
			RiskLevel:    riskLevel,
			KeyChanges:   keyChanges,
		},
		DialysisAnalysis: dialysis,
		NutritionAnalysis: NutritionAnalysis{
			AppetiteTrend: appetiteTrend,
		},
		WarningSignals: warnings,
	}
}

// hasConsecutiveWorsening checks if there are 2+ consecutive days with strictly
// worsening status in the given records (must be pre-sorted by date).
func hasConsecutiveWorsening(records []models.DailyRecord, valueMap map[string]int, getStatus func(*models.DailyRecord) string) bool {
	consecutiveCount := 1
	for i := 1; i < len(records); i++ {
		prevVal, prevOk := valueMap[getStatus(&records[i-1])]
		currVal, currOk := valueMap[getStatus(&records[i])]
		if prevOk && currOk && currVal > prevVal {
			consecutiveCount++
			if consecutiveCount >= 2 {
				return true
			}
		} else {
			consecutiveCount = 1
		}
	}
	return false
}