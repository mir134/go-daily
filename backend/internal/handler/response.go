package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Success sends a successful response with HTTP 200 status
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": data,
	})
}

// Created sends a successful response with HTTP 201 status
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{
		"code": http.StatusCreated,
		"data": data,
	})
}

// Error sends an error response with the specified HTTP status and message
// If message is empty, uses http.StatusText(httpStatus) as the default message
func Error(c *gin.Context, httpStatus int, message string) {
	if message == "" {
		message = http.StatusText(httpStatus)
	}
	c.JSON(httpStatus, gin.H{
		"code":    httpStatus,
		"message": message,
	})
}

// ValidationError sends a validation error response with HTTP 422 status
func ValidationError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusUnprocessableEntity, gin.H{
		"code":    http.StatusUnprocessableEntity,
		"message": "Validation failed",
		"errors":  errors,
	})
}

// Paginated sends a paginated response with HTTP 200 status
func Paginated(c *gin.Context, items interface{}, total int64, page int, pageSize int) {
	c.JSON(http.StatusOK, gin.H{
		"code":     http.StatusOK,
		"data":     items,
		"total":    total,
		"page":     page,
		"page_size": pageSize,
	})
}
