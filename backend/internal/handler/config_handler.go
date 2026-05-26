package handler

import (
	"net/http"

	"go-daily/internal/service"

	"github.com/gin-gonic/gin"
)

// ConfigHandler handles HTTP requests for app configuration settings.
type ConfigHandler struct {
	svc *service.ConfigService
}

// NewConfigHandler creates a new ConfigHandler instance.
func NewConfigHandler(svc *service.ConfigService) *ConfigHandler {
	return &ConfigHandler{svc: svc}
}

// GetSettings handles GET /api/settings
func (h *ConfigHandler) GetSettings(c *gin.Context) {
	settings, err := h.svc.GetSettings()
	if err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	Success(c, settings)
}

// SaveSettings handles PUT /api/settings
func (h *ConfigHandler) SaveSettings(c *gin.Context) {
	var settings service.Settings
	if err := c.BindJSON(&settings); err != nil {
		Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}
	if err := h.svc.SaveSettings(&settings); err != nil {
		Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	Success(c, settings)
}
