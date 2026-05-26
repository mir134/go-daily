package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LoggerMiddleware returns a gin.HandlerFunc that logs requests with zap
func LoggerMiddleware() gin.HandlerFunc {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	return func(c *gin.Context) {
		// Start timer
		timeStart := time.Now()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(timeStart).Milliseconds()

		// Log using zap
		logger.Info("request handled",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Int64("latency_ms", latency),
			zap.String("client_ip", c.ClientIP()),
		)
	}
}

// CorsMiddleware returns a gin.HandlerFunc that handles CORS requests
func CorsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight OPTIONS request
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		// Continue processing
		c.Next()
	}
}

// RecoveryMiddleware returns a gin.HandlerFunc that recovers from panics
func RecoveryMiddleware() gin.HandlerFunc {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with stack trace
				logger.Error("panic recovered",
					zap.Any("error", err),
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.Stack("stack_trace"),
				)

				// Return 500 error
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Internal Server Error",
				})
			}
		}()

		// Continue processing
		c.Next()
	}
}

// AuthMiddleware returns a gin.HandlerFunc that checks authentication
func AuthMiddleware(password string) gin.HandlerFunc {
	// Skip auth for these endpoints
	skipPaths := map[string]bool{
		"/api/login":   true,
		"/api/health":  true,
		"/api/logout":  true,
	}

	return func(c *gin.Context) {
		// Skip auth for specified paths
		if skipPaths[c.Request.URL.Path] {
			c.Next()
			return
		}

// Get auth token from cookie
		token, err := c.Cookie("auth_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "未登录",
			})
			return
		}

		// Validate token
		if !ValidateToken(token, password) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "登录已过期，请重新登录",
			})
			return
		}

		// Continue processing
		c.Next()
	}
}

// GenerateToken creates a new HMAC signed token with 24h expiry
func GenerateToken(secret string) (string, error) {
	// Set expiry to 24 hours from now
	expiry := time.Now().Add(24 * time.Hour).Unix()
	expiryStr := strconv.FormatInt(expiry, 10)

	// Create HMAC signature
	hmacHash := hmac.New(sha256.New, []byte(secret))
	hmacHash.Write([]byte(expiryStr))
	signature := hmacHash.Sum(nil)

	// Combine expiry and signature
	tokenData := fmt.Sprintf("%s:%x", expiryStr, signature)

	// Encode to base64
	return base64.URLEncoding.EncodeToString([]byte(tokenData)), nil
}

// ValidateToken checks if a token is valid and not expired
func ValidateToken(token string, secret string) bool {
	// Decode base64 token
	decoded, err := base64.URLEncoding.DecodeString(token)
	if err != nil {
		return false
	}

	// Split into expiry and signature
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return false
	}

	expiryStr, signatureStr := parts[0], parts[1]

	// Parse expiry time
	expiry, err := strconv.ParseInt(expiryStr, 10, 64)
	if err != nil {
		return false
	}

	// Check if token is expired
	if time.Now().Unix() > expiry {
		return false
	}

	// Verify HMAC signature
	hmacHash := hmac.New(sha256.New, []byte(secret))
	hmacHash.Write([]byte(expiryStr))
	expectedSignature := hmacHash.Sum(nil)

	// Compare signatures in constant time
	return hmac.Equal([]byte(signatureStr), []byte(fmt.Sprintf("%x", expectedSignature)))
}
