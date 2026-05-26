package handler

import (
	"net/http"
	"strconv"
	"time"

	"go-daily/internal/export"
	"go-daily/internal/models"
	"go-daily/internal/service"

	"github.com/gin-gonic/gin"
)

// RecordHandler handles HTTP requests for DailyRecord operations
type RecordHandler struct {
	svc *service.RecordService
}

// NewRecordHandler creates a new RecordHandler instance
func NewRecordHandler(svc *service.RecordService) *RecordHandler {
	return &RecordHandler{svc: svc}
}

// ListRecords handles GET /api/records?page=1&page_size=20
func (h *RecordHandler) ListRecords(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 200 {
		pageSize = 20
	}

	records, total, err := h.svc.ListRecords(page, pageSize)
	if err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	Paginated(c, records, total, page, pageSize)
}

// CreateRecord handles POST /api/records
func (h *RecordHandler) CreateRecord(c *gin.Context) {
	var record models.DailyRecord
	if err := c.BindJSON(&record); err != nil {
		Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if err := h.svc.CreateRecord(&record); err != nil {
		Error(c, http.StatusBadRequest, err.Error())
		return
	}

	Created(c, record)
}

// GetRecord handles GET /api/records/:id
func (h *RecordHandler) GetRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		Error(c, http.StatusBadRequest, "无效的记录ID")
		return
	}

	record, err := h.svc.GetRecord(uint(id))
	if err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	if record == nil {
		Error(c, http.StatusNotFound, "记录不存在")
		return
	}

	Success(c, record)
}

// UpdateRecord handles PUT /api/records/:id
func (h *RecordHandler) UpdateRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		Error(c, http.StatusBadRequest, "无效的记录ID")
		return
	}

	var record models.DailyRecord
	if err := c.BindJSON(&record); err != nil {
		Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}
	record.ID = uint(id)

	if err := h.svc.UpdateRecord(&record); err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	Success(c, record)
}

// DeleteRecord handles DELETE /api/records/:id
func (h *RecordHandler) DeleteRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		Error(c, http.StatusBadRequest, "无效的记录ID")
		return
	}

	if err := h.svc.DeleteRecord(uint(id)); err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	Success(c, gin.H{"message": "删除成功"})
}

// GetTodayRecord handles GET /api/records/today?period=morning
func (h *RecordHandler) GetTodayRecord(c *gin.Context) {
	period := c.DefaultQuery("period", "morning")
	record, err := h.svc.GetTodayRecord(period)
	if err != nil {
		// No record for today — return null data
		Success(c, nil)
		return
	}

	Success(c, record)
}

// UpsertRecord handles PUT /api/records/today
func (h *RecordHandler) UpsertRecord(c *gin.Context) {
	var record models.DailyRecord
	if err := c.BindJSON(&record); err != nil {
		Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if record.Date == "" {
		record.Date = time.Now().Format("2006-01-02")
	}

	if record.Period == "" {
		record.Period = "morning"
	}

	if err := h.svc.UpsertRecord(&record); err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	Success(c, record)
}

// ExportRecords handles GET /api/records/export?format=json|csv
func (h *RecordHandler) ExportRecords(c *gin.Context) {
	format := c.DefaultQuery("format", "json")

	records, err := h.svc.GetAllRecords()
	if err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	switch format {
	case "csv":
		data, err := export.ExportCSV(records)
		if err != nil {
			Error(c, http.StatusInternalServerError, err.Error())
			return
		}
		c.Data(http.StatusOK, "text/csv; charset=utf-8", data)
	default:
		data, err := export.ExportJSON(records)
		if err != nil {
			Error(c, http.StatusInternalServerError, err.Error())
			return
		}
		c.Data(http.StatusOK, "application/json", data)
	}
}

// CheckAlerts handles GET /api/alerts
func (h *RecordHandler) CheckAlerts(c *gin.Context) {
	alerts, err := h.svc.CheckRiskAlerts()
	if err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	Success(c, alerts)
}

// Health handles GET /api/health
func (h *RecordHandler) Health(c *gin.Context) {
	Success(c, gin.H{
		"status":  "ok",
		"version": "1.0.0",
	})
}