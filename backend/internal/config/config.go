package config

import (
	"fmt"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Config represents the application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	App      AppConfig      `yaml:"app"`
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port int    `yaml:"port"` // 默认端口 8080
	Host string `yaml:"host"` // 默认监听地址 0.0.0.0
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Path string `yaml:"path"` // 数据库文件路径
}

// AppConfig holds application-specific configuration
type AppConfig struct {
	Password        string `yaml:"password"`         // 从环境变量 APP_PASSWORD 获取
	Name            string `yaml:"name"`             // 应用名称
	DialysisEnabled bool   `yaml:"dialysisEnabled"`  // 是否启用透析记录功能
}

// defaultConfig returns the default configuration
func defaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: 8080,
			Host: "0.0.0.0",
		},
		Database: DatabaseConfig{
			Path: "./data/app.db",
		},
		App: AppConfig{
			Name:            "家庭健康记录",
			DialysisEnabled: true,
		},
	}
}

// LoadConfig loads configuration from a YAML file and overrides with environment variables
// If the file doesn't exist, it uses default values and creates a default config file
func LoadConfig(path string) (*Config, error) {
	cfg := defaultConfig()

	// Try to load from YAML file
	if _, err := os.Stat(path); err == nil {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}

		if err := yaml.Unmarshal(data, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config file: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return nil, fmt.Errorf("failed to check config file: %w", err)
	} else {
		// Config file doesn't exist, create default config file
		if err := createDefaultConfigFile(path); err != nil {
			return nil, fmt.Errorf("failed to create default config file: %w", err)
		}
	}

	// Override with environment variables
	applyEnvOverrides(cfg)

	return cfg, nil
}

// LoadConfigFromEnv loads configuration from environment variables only
func LoadConfigFromEnv() (*Config, error) {
	cfg := defaultConfig()
	applyEnvOverrides(cfg)
	return cfg, nil
}

// applyEnvOverrides applies environment variable overrides to the configuration
func applyEnvOverrides(cfg *Config) {
	// APP_PORT -> Server.Port
	if portStr := os.Getenv("APP_PORT"); portStr != "" {
		if port, err := strconv.Atoi(portStr); err == nil {
			cfg.Server.Port = port
		}
	}

	// APP_HOST -> Server.Host
	if host := os.Getenv("APP_HOST"); host != "" {
		cfg.Server.Host = host
	}

	// APP_DB_PATH -> Database.Path
	if dbPath := os.Getenv("APP_DB_PATH"); dbPath != "" {
		cfg.Database.Path = dbPath
	}

	// APP_PASSWORD -> App.Password
	if password := os.Getenv("APP_PASSWORD"); password != "" {
		cfg.App.Password = password
	}
}

// createDefaultConfigFile creates a default configuration file with Chinese comments
func createDefaultConfigFile(path string) error {
	defaultYAML := `# 服务器配置
server:
  port: 8080              # 服务器监听端口，默认 8080
  host: "0.0.0.0"         # 服务器监听地址，默认 0.0.0.0

# 数据库配置
database:
  path: "./data/app.db"   # SQLite 数据库文件路径

# 应用配置
app:
  password: ""            # 应用密码，从环境变量 APP_PASSWORD 获取
  name: "家庭健康记录"      # 应用名称
  dialysisEnabled: true   # 是否启用透析记录功能
`

	return os.WriteFile(path, []byte(defaultYAML), 0644)
}