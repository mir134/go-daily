package handler

import (
	"net/http"

	"go-daily/internal/auth"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *auth.AuthService
}

// NewAuthHandler creates a new AuthHandler with the given auth service
func NewAuthHandler(authService *auth.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// loginRequest represents the login request body
type loginRequest struct {
	Password string `json:"password" binding:"required"`
}

// LoginHandler handles POST /api/login
// Accepts JSON body {"password": "..."}, validates against configured password,
// and sets an httpOnly auth_token cookie on success
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if !h.authService.ValidatePassword(req.Password) {
		Error(c, http.StatusUnauthorized, "密码错误")
		return
	}

	token, err := h.authService.GenerateToken()
	if err != nil {
		Error(c, http.StatusInternalServerError, "生成令牌失败")
		return
	}

	// Set auth_token cookie with 24h expiry
	c.SetCookie(
		"auth_token",
		token,
		86400,           // maxAge: 24h in seconds
		"/",             // path
		"",              // domain (empty = current)
		false,           // secure (false for dev/http)
		true,            // httpOnly
	)

	Success(c, gin.H{"status": "ok"})
}

// LogoutHandler handles POST /api/logout
// Clears the auth_token cookie to invalidate the session
func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	// Clear cookie by setting maxAge to -1
	c.SetCookie(
		"auth_token",
		"",
		-1,   // maxAge: -1 deletes the cookie
		"/",  // path
		"",   // domain
		false, // secure
		true,  // httpOnly
	)

	Success(c, gin.H{"status": "ok"})
}

// StatusHandler handles GET /api/auth/status
// Checks the auth_token cookie and returns authentication status
func (h *AuthHandler) StatusHandler(c *gin.Context) {
	token, err := c.Cookie("auth_token")
	if err != nil || !h.authService.ValidateToken(token) {
		Success(c, gin.H{"authenticated": false})
		return
	}

	Success(c, gin.H{"authenticated": true})
}