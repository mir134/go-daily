package export

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"

	"go-daily/internal/models"
)

// ExportJSON marshals DailyRecord slice to pretty-printed JSON.
func ExportJSON(records []models.DailyRecord) ([]byte, error) {
	return json.MarshalIndent(records, "", "  ")
}

// ExportCSV writes DailyRecord slice as CSV with UTF-8 BOM and Chinese headers.
// The output is compatible with Excel.
func ExportCSV(records []models.DailyRecord) ([]byte, error) {
	buf := new(bytes.Buffer)
	// Write UTF-8 BOM for Excel compatibility
	buf.WriteString("\xef\xbb\xbf")

	writer := csv.NewWriter(buf)

	// Write header
	headers := []string{
		"日期", "时段", "整体状态", "呼吸状态", "平躺能力", "食欲", "呕吐",
		"精神状态", "情绪状态", 		"是否透析", "透析类型",
		"透析前体重", "透析后体重", "脱水量", "血压", "血氧", "血糖",
		"黑便", "吐血", "备注",
	}
	if err := writer.Write(headers); err != nil {
		return nil, fmt.Errorf("write csv header: %w", err)
	}

	for _, r := range records {
		row := []string{
			r.Date,
			mapPeriod(r.Period),
			mapOverallStatus(r.OverallStatus),
			mapBreathingStatus(r.BreathingStatus),
			mapSleepPosition(r.SleepPosition),
			mapAppetiteStatus(r.AppetiteStatus),
			mapVomitStatus(r.VomitStatus),
			mapMentalStatus(r.MentalStatus),
			mapEmotionStatus(r.EmotionStatus),
			mapBool(r.IsDialysisDay),
			mapDialysisPhase(r.DialysisPhase),
			formatFloat64Ptr(r.PreWeight),
			formatFloat64Ptr(r.PostWeight),
			formatFloat64Ptr(r.UltrafiltrationVolume),
			r.BloodPressure,
			formatIntPtr(r.OxygenSaturation),
			formatFloat64Ptr(r.BloodSugar),
			mapBool(r.HasBlackStool),
			mapBool(r.HasBloodVomiting),
			r.Notes,
		}
		if err := writer.Write(row); err != nil {
			return nil, fmt.Errorf("write csv row for date %s: %w", r.Date, err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("csv writer flush: %w", err)
	}

	return buf.Bytes(), nil
}

func mapOverallStatus(s string) string {
	switch s {
	case models.OverallStatusGood:
		return "还可以"
	case models.OverallStatusNormal:
		return "一般"
	case models.OverallStatusUncomfortable:
		return "不舒服"
	case models.OverallStatusSevere:
		return "很难受"
	default:
		return s
	}
}

func mapBreathingStatus(s string) string {
	switch s {
	case models.BreathingStatusNoWheeze:
		return "不喘"
	case models.BreathingStatusWalkWheeze:
		return "走路喘"
	case models.BreathingStatusSitWheeze:
		return "坐着也喘"
	default:
		return s
	}
}

func mapSleepPosition(s string) string {
	switch s {
	case models.SleepPositionCan:
		return "能"
	case models.SleepPositionHalf:
		return "半躺"
	case models.SleepPositionCannot:
		return "不能"
	default:
		return s
	}
}

func mapAppetiteStatus(s string) string {
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

func mapVomitStatus(s string) string {
	switch s {
	case models.VomitStatusNone:
		return "没有"
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

func mapMentalStatus(s string) string {
	switch s {
	case models.MentalStatusChatty:
		return "能聊天"
	case models.MentalStatusListless:
		return "没精神"
	case models.MentalStatusSleepy:
		return "嗜睡"
	default:
		return s
	}
}

func mapEmotionStatus(s string) string {
	switch s {
	case models.EmotionStatusStable:
		return "平稳"
	case models.EmotionStatusAgitated:
		return "激动"
	case models.EmotionStatusQuarrel:
		return "长时间争吵"
	default:
		return s
	}
}

func mapDialysisPhase(s string) string {
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

func mapPeriod(s string) string {
	switch s {
	case models.PeriodMorning:
		return "早上"
	case models.PeriodEvening:
		return "下午"
	default:
		return s
	}
}

func mapBool(b bool) string {
	if b {
		return "是"
	}
	return "否"
}

func formatFloat64Ptr(f *float64) string {
	if f == nil {
		return ""
	}
	return fmt.Sprintf("%.1f", *f)
}

func formatIntPtr(i *int) string {
	if i == nil {
		return ""
	}
	return fmt.Sprintf("%d", *i)
}