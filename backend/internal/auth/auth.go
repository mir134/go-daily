package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// AuthService handles password validation and token management
type AuthService struct {
	password  string
	secretKey [32]byte
}

// NewAuthService creates a new AuthService with the given password
func NewAuthService(password string) *AuthService {
	svc := &AuthService{
		password: password,
	}
	// Generate a random secret key at startup
	rand.Read(svc.secretKey[:])
	return svc
}

// ValidatePassword validates the input password against the stored password
// using constant-time comparison to prevent timing attacks
func (s *AuthService) ValidatePassword(input string) bool {
	inputHash := sha256.Sum256([]byte(input))
	passwordHash := sha256.Sum256([]byte(s.password))
	return subtle.ConstantTimeCompare(inputHash[:], passwordHash[:]) == 1
}

// GenerateToken creates a new HMAC-SHA256 signed token with 24h expiry
// Uses password as HMAC key for compatibility with middleware token validation.
// Token format: base64(expiry_timestamp + ":" + hex_encoded_hmac_signature)
func (s *AuthService) GenerateToken() (string, error) {
	expiry := time.Now().Add(24 * time.Hour).Unix()
	expiryStr := strconv.FormatInt(expiry, 10)

	// Create HMAC-SHA256 signature using password as key (middleware compatible)
	mac := hmac.New(sha256.New, []byte(s.password))
	mac.Write([]byte(expiryStr))
	signature := mac.Sum(nil)

	// Format: expiry:hex_signature, then base64 encode
	tokenData := fmt.Sprintf("%s:%x", expiryStr, signature)
	return base64.URLEncoding.EncodeToString([]byte(tokenData)), nil
}

// ValidateToken validates a token: decodes, verifies HMAC signature, checks expiry
func (s *AuthService) ValidateToken(token string) bool {
	// Decode base64 token
	decoded, err := base64.URLEncoding.DecodeString(token)
	if err != nil {
		return false
	}

	// Split into expiry and signature parts
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return false
	}

	expiryStr, signatureStr := parts[0], parts[1]

	// Parse expiry timestamp
	expiry, err := strconv.ParseInt(expiryStr, 10, 64)
	if err != nil {
		return false
	}

	// Check if token is expired
	if time.Now().Unix() > expiry {
		return false
	}

	// Recompute HMAC signature using password (middleware compatible)
	mac := hmac.New(sha256.New, []byte(s.password))
	mac.Write([]byte(expiryStr))
	expectedSignature := mac.Sum(nil)

	// Compare hex-encoded signature using constant-time comparison
	return hmac.Equal([]byte(signatureStr), []byte(fmt.Sprintf("%x", expectedSignature)))
}