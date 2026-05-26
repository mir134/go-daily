package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"go-daily/internal/ai"
	"go-daily/internal/auth"
	"go-daily/internal/config"
	"go-daily/internal/database"
	"go-daily/internal/embed"
	"go-daily/internal/handler"
	"go-daily/internal/middleware"
	"go-daily/internal/repository"
	"go-daily/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	configPath := flag.String("config", "config.yaml", "配置文件路径")
	flag.Parse()

	// 1. Load config
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Setup logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// 3. Initialize database
	db, err := database.Init(cfg.Database.Path, logger)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	if err := database.AutoMigrate(db); err != nil {
		logger.Fatal("Failed to auto-migrate database", zap.Error(err))
	}

	// 4. Initialize layers
	recordRepo := repository.NewRecordRepository(db)
	configRepo := repository.NewAppConfigRepository(db)

	recordSvc := service.NewRecordService(recordRepo)
	configSvc := service.NewConfigService(configRepo)
	authSvc := auth.NewAuthService(cfg.App.Password)

	aiSvc := ai.NewAIService(recordRepo)
	aiHandler := ai.NewAIHandler(aiSvc)

	recordHandler := handler.NewRecordHandler(recordSvc)
	configHandler := handler.NewConfigHandler(configSvc)
	authHandler := handler.NewAuthHandler(authSvc)

	// 5. Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.CorsMiddleware())
	r.Use(middleware.RecoveryMiddleware())

	// API routes — no auth
	r.GET("/api/health", recordHandler.Health)
	r.POST("/api/login", authHandler.LoginHandler)
	r.POST("/api/logout", authHandler.LogoutHandler)
	r.GET("/api/auth/status", authHandler.StatusHandler)

	// API routes — auth required
	api := r.Group("/api", middleware.AuthMiddleware(cfg.App.Password))
	{
		api.GET("/records", recordHandler.ListRecords)
		api.POST("/records", recordHandler.CreateRecord)
		api.GET("/records/today", recordHandler.GetTodayRecord)
		api.PUT("/records/today", recordHandler.UpsertRecord)
		api.GET("/records/export", recordHandler.ExportRecords)
		api.GET("/records/:id", recordHandler.GetRecord)
		api.PUT("/records/:id", recordHandler.UpdateRecord)
		api.DELETE("/records/:id", recordHandler.DeleteRecord)
		api.GET("/alerts", recordHandler.CheckAlerts)
		api.GET("/settings", configHandler.GetSettings)
		api.PUT("/settings", configHandler.SaveSettings)
		// AI analysis routes
		api.GET("/ai/summary", aiHandler.GetSummary)
		api.GET("/ai/context", aiHandler.GetContext)
		api.GET("/ai/risk-score", aiHandler.GetRiskScore)
	}

	// Serve embedded frontend with SPA fallback
	frontendFS, err := embed.GetFS()
	if err != nil {
		logger.Fatal("Failed to get frontend filesystem", zap.Error(err))
	}
	r.Use(func(c *gin.Context) {
		// Skip API routes
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.Next()
			return
		}
		// Try to serve the requested file from embedded FS
		filePath := strings.TrimPrefix(c.Request.URL.Path, "/")
		if filePath == "" {
			filePath = "index.html"
		}
		file, err := frontendFS.Open(filePath)
		if err == nil {
			defer file.Close()
			stat, _ := file.Stat()
			if !stat.IsDir() {
				http.ServeContent(c.Writer, c.Request, stat.Name(), stat.ModTime(), file.(io.ReadSeeker))
				c.Abort()
				return
			}
		}
		// SPA fallback: serve index.html
		indexFile, err := frontendFS.Open("index.html")
		if err != nil {
			c.Next()
			return
		}
		defer indexFile.Close()
		stat, _ := indexFile.Stat()
		http.ServeContent(c.Writer, c.Request, "index.html", stat.ModTime(), indexFile.(io.ReadSeeker))
		c.Abort()
	})

	// 404 for unmatched API routes
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "接口不存在"})
			return
		}
		// SPA fallback for any other unmatched routes
		indexFile, err := frontendFS.Open("index.html")
		if err != nil {
			c.String(http.StatusNotFound, "Not found")
			return
		}
		defer indexFile.Close()
		stat, _ := indexFile.Stat()
		http.ServeContent(c.Writer, c.Request, "index.html", stat.ModTime(), indexFile.(io.ReadSeeker))
	})

	// 6. Graceful shutdown
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	// Start server in goroutine
	go func() {
		logger.Info("Server starting", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}
	logger.Info("Server exited")
}