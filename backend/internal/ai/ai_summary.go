package ai

import (
	"fmt"
	"sort"
	"strings"

	"go-daily/internal/models"
)

// BuildLLMContext generates a Chinese-language prompt from records and risk results.
// The output is designed to be directly pasted into an LLM prompt for trend analysis.
//
// Parameters:
//   - records: Daily records (will be sorted by date internally)
//   - riskResult: optional risk score result (pass nil to skip risk section)
//
// Returns a formatted string ready for LLM consumption.
func BuildLLMContext(records []models.DailyRecord, riskResult *RiskScoreResult) string {
	if len(records) == 0 {
		return "近期无记录数据。"
	}

	// Sort by date ascending
	sorted := make([]models.DailyRecord, len(records))
	copy(sorted, records)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Date < sorted[j].Date
	})

	var b strings.Builder

	// ── Header ──
	b.WriteString("## 患者近7天状态趋势\n\n")

	// Date range
	startDate := sorted[0].Date
	endDate := sorted[len(sorted)-1].Date
	b.WriteString(fmt.Sprintf("日期范围: %s ~ %s\n\n", startDate, endDate))

	// ── 1. Daily Record Table ──
	b.WriteString("### 逐日记录\n\n")
	b.WriteString("| 日期 | 整体 | 呼吸 | 食欲 | 呕吐 | 阶段 | 备注 |\n")
	b.WriteString("|------|------|------|------|------|------|------|\n")

	for _, r := range sorted {
		overallLabel := overallLabelCN(r.OverallStatus)
		breathingLabel := breathingLabelCN(r.BreathingStatus)
		appetiteLabel := appetiteLabelCN(r.AppetiteStatus)
		vomitLabel := vomitLabelCN(r.VomitStatus)
		phaseLabel := phaseLabelCN(r.DialysisPhase)

		notes := r.Notes
		if len([]rune(notes)) > 20 {
			runes := []rune(notes)
			notes = string(runes[:20]) + "..."
		}

		b.WriteString(fmt.Sprintf("| %s | %s | %s | %s | %s | %s | %s |\n",
			r.Date, overallLabel, breathingLabel, appetiteLabel, vomitLabel, phaseLabel, notes))
	}
	b.WriteString("\n")

	// ── 2. Trend Analysis ──
	b.WriteString("### 趋势分析\n\n")
	b.WriteString(analyzeTrendSection(sorted))
	b.WriteString("\n")

	// ── 3. Dialysis Analysis ──
	b.WriteString("### 透析分析\n\n")
	b.WriteString(analyzeDialysisSection(sorted))
	b.WriteString("\n")

	// ── 4. Risk Assessment ──
	if riskResult != nil {
		b.WriteString("### 风险评估\n\n")
		riskLabel := riskLevelCN(riskResult.RiskLevel)
		b.WriteString(fmt.Sprintf("风险等级: %s (%d分)\n\n", riskLabel, riskResult.RiskScore))

		if len(riskResult.Factors) > 0 {
			b.WriteString("风险因素:\n")
			for _, f := range riskResult.Factors {
				b.WriteString(fmt.Sprintf("- %s (+%d分)\n", factorNameCN(f.Name), f.Score))
			}
		} else {
			b.WriteString("无明显风险因素。\n")
		}
		b.WriteString("\n")
	}

	// ── 5. Summary ──
	b.WriteString("### 总结\n\n")
	b.WriteString(generateSummary(sorted, riskResult))
	b.WriteString("\n")

	// ── 6. Questions for AI ──
	b.WriteString("### 请分析\n\n")
	b.WriteString("1. 患者整体趋势是向好还是恶化？\n")
	b.WriteString("2. 是否存在需要立即就医的预警信号？\n")
	b.WriteString("3. 透析治疗效果如何？是否需要调整？\n")
	b.WriteString("4. 容量状态管理是否合理？\n")
	b.WriteString("5. 给出具体的护理建议。\n")

	return b.String()
}

// --- Helper: Chinese labels ---

func overallLabelCN(s string) string {
	switch s {
	case models.OverallStatusGood:
		return "好"
	case models.OverallStatusNormal:
		return "一般"
	case models.OverallStatusUncomfortable:
		return "不舒服"
	case models.OverallStatusSevere:
		return "严重"
	default:
		return s
	}
}

func breathingLabelCN(s string) string {
	switch s {
	case models.BreathingStatusNoWheeze:
		return "不喘"
	case models.BreathingStatusWalkWheeze:
		return "走路喘"
	case models.BreathingStatusSitWheeze:
		return "静息喘"
	default:
		return s
	}
}

func appetiteLabelCN(s string) string {
	switch s {
	case models.AppetiteStatusGood:
		return "吃得好"
	case models.AppetiteStatusLittle:
		return "吃一点"
	case models.AppetiteStatusNone:
		return "吃不下"
	default:
		return s
	}
}

func vomitLabelCN(s string) string {
	switch s {
	case models.VomitStatusNone:
		return "无"
	case models.VomitStatusNausea:
		return "恶心"
	case models.VomitStatusVomit:
		return "呕吐"
	case models.VomitStatusBlood:
		return "吐血"
	default:
		return s
	}
}

func phaseLabelCN(s string) string {
	switch s {
	case models.DialysisPhaseNonDialysis:
		return "非透析日"
	case models.DialysisPhaseHemodialysis:
		return "血透"
	case models.DialysisPhasePerfusion:
		return "灌流"
	case models.DialysisPhaseHemofiltration:
		return "血滤"
	default:
		return s
	}
}

func riskLevelCN(s string) string {
	switch s {
	case "low":
		return "低风险"
	case "medium":
		return "中风险"
	case "high":
		return "高风险"
	default:
		return s
	}
}

func factorNameCN(s string) string {
	switch s {
	case "appetite_decline":
		return "食欲下降"
	case "breathing_decline":
		return "呼吸困难加重"
	case "sleep_decline":
		return "平躺能力下降"
	case "vomit_blood":
		return "呕血"
	case "blood_vomiting":
		return "吐血"
	case "black_stool":
		return "黑便"
	default:
		return s
	}
}

// analyzeTrendSection builds the trend analysis text.
func analyzeTrendSection(sorted []models.DailyRecord) string {
	if len(sorted) < 2 {
		return "数据不足，无法进行趋势分析。\n"
	}

	var b strings.Builder

	// Appetite trend
	b.WriteString("- 食欲: ")
	b.WriteString(describeTrend(sorted, AppetiteValues, func(r *models.DailyRecord) string {
		return r.AppetiteStatus
	}, appetiteLabelCN))
	b.WriteString("\n")

	// Breathing trend
	b.WriteString("- 呼吸: ")
	b.WriteString(describeTrend(sorted, BreathingValues, func(r *models.DailyRecord) string {
		return r.BreathingStatus
	}, breathingLabelCN))
	b.WriteString("\n")

	// Sleep trend
	b.WriteString("- 平躺: ")
	b.WriteString(describeTrend(sorted, SleepValues, func(r *models.DailyRecord) string {
		return r.SleepPosition
	}, sleepLabelCN))
	b.WriteString("\n")

	return b.String()
}

func sleepLabelCN(s string) string {
	switch s {
	case "can":
		return "能平躺"
	case "half":
		return "半躺"
	case "cannot":
		return "不能平躺"
	default:
		return s
	}
}

// describeTrend generates a human-readable trend description.
func describeTrend(sorted []models.DailyRecord, valueMap map[string]int,
	getStatus func(*models.DailyRecord) string,
	labelFn func(string) string) string {

	if len(sorted) < 2 {
		return "数据不足"
	}

	// Get last 3 records' statuses
	start := 0
	if len(sorted) > 3 {
		start = len(sorted) - 3
	}
	recent := sorted[start:]

	var statuses []string
	for _, r := range recent {
		statuses = append(statuses, labelFn(getStatus(&r)))
	}

	// Detect direction
	engine := &RiskEngine{}
	trend := engine.AnalyzeTrend(sorted, valueMap, getStatus)

	switch trend {
	case "declining":
		return fmt.Sprintf("恶化趋势 (最近: %s)", strings.Join(statuses, " → "))
	case "improving":
		return fmt.Sprintf("改善趋势 (最近: %s)", strings.Join(statuses, " → "))
	case "stable":
		return fmt.Sprintf("稳定 (最近: %s)", statuses[len(statuses)-1])
	case "unstable":
		return fmt.Sprintf("波动 (最近: %s)", strings.Join(statuses, " → "))
	default:
		return "数据不足"
	}
}

// analyzeDialysisSection builds dialysis analysis text.
func analyzeDialysisSection(sorted []models.DailyRecord) string {
	// Collect unique dialysis days
	typeSet := map[string]bool{}
	dialysisDays := map[string]models.DailyRecord{}
	for _, r := range sorted {
		if r.DialysisPhase == models.DialysisPhaseNonDialysis || r.DialysisPhase == "" {
			continue
		}
		typeSet[r.DialysisPhase] = true
		if _, ok := dialysisDays[r.Date]; !ok || r.Period == "morning" {
			dialysisDays[r.Date] = r
		}
	}

	var b strings.Builder

	if len(dialysisDays) == 0 {
		b.WriteString("近期无透析记录。\n")
		return b.String()
	}

	b.WriteString(fmt.Sprintf("透析天数: %d天\n", len(dialysisDays)))

	// Dialysis type distribution (count unique days per type)
	typeCount := map[string]int{}
	for _, r := range dialysisDays {
		typeCount[r.DialysisPhase]++
	}
	if len(typeCount) > 0 {
		b.WriteString("透析类型分布:\n")
		for phase, count := range typeCount {
			b.WriteString(fmt.Sprintf("  - %s: %d天\n", phaseLabelCN(phase), count))
		}
	}

	if len(dialysisDays) >= 2 {
		dialysisRecords := make([]models.DailyRecord, 0, len(dialysisDays))
		for _, r := range dialysisDays {
			dialysisRecords = append(dialysisRecords, r)
		}
		sort.Slice(dialysisRecords, func(i, j int) bool { return dialysisRecords[i].Date < dialysisRecords[j].Date })

		b.WriteString("- 透析日状态: ")
		b.WriteString(describeTrend(dialysisRecords, AppetiteValues, func(r *models.DailyRecord) string {
			return r.AppetiteStatus
		}, appetiteLabelCN))
		b.WriteString("\n")
	}

	return b.String()
}

// generateSummary creates a final summary paragraph.
func generateSummary(sorted []models.DailyRecord, riskResult *RiskScoreResult) string {
	if len(sorted) == 0 {
		return "暂无数据。"
	}

	var b strings.Builder

	latest := sorted[len(sorted)-1]

	b.WriteString(fmt.Sprintf("截至%s，", latest.Date))

	// Overall status
	b.WriteString(fmt.Sprintf("患者整体状态为「%s」。", overallLabelCN(latest.OverallStatus)))

	// Key issues from the latest record
	if latest.VomitStatus == models.VomitStatusVomit || latest.VomitStatus == models.VomitStatusBlood {
		b.WriteString("出现呕吐症状，")
	}
	if latest.HasBloodVomiting {
		b.WriteString("出现吐血，需立即关注，")
	}
	if latest.HasBlackStool {
		b.WriteString("出现黑便，需立即关注，")
	}
	if latest.BreathingStatus == models.BreathingStatusSitWheeze {
		b.WriteString("静息时呼吸困难，")
	}

	// Trend-based summary
	if riskResult != nil {
		if riskResult.RiskLevel == "high" {
			b.WriteString("当前风险等级高，建议及时就医评估。")
		} else if riskResult.RiskLevel == "medium" {
			b.WriteString("存在一定风险，请密切关注变化。")
		} else {
			b.WriteString("目前状况相对稳定。")
		}
	}

	return b.String()
}