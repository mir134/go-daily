package ai

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AIHandler handles AI analysis HTTP requests
type AIHandler struct {
	svc *AIService
}

// NewAIHandler creates a new AIHandler instance
func NewAIHandler(svc *AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

// GetSummary handles GET /api/ai/summary
// Returns a summary of patient status, trend, dialysis analysis, and warnings.
// Response: {"code": 200, "data": SummaryResult}
func (h *AIHandler) GetSummary(c *gin.Context) {
	result, err := h.svc.GetSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": result})
}

// GetContext handles GET /api/ai/context
// Returns structured context for LLM prompt building.
// Response: {"code": 200, "data": ContextResult}
func (h *AIHandler) GetContext(c *gin.Context) {
	result, err := h.svc.GetContext()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": result})
}

// GetRiskScore handles GET /api/ai/risk-score
// Returns risk score, level, and contributing factors.
// Response: {"code": 200, "data": RiskScoreResult}
func (h *AIHandler) GetRiskScore(c *gin.Context) {
	result, err := h.svc.GetRiskScore()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": result})
}