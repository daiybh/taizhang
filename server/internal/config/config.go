package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	ThirdParty ThirdPartyConfig
	OSS        OSSConfig
}

type ServerConfig struct {
	Port string
	Mode string
}

type DatabaseConfig struct {
	DSN string
}

type ThirdPartyConfig struct {
	ParkID  string
	BaseURL string
}

type OSSConfig struct {
	Endpoint        string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
}

var cfg *Config

func Load() *Config {
	// 加载 .env 文件（如果存在）
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables: %v", err)
	}

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/taizhang")

	// 设置默认值
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.mode", "release")

	// 允许通过环境变量覆盖配置（优先级：环境变量 > 配置文件 > 默认值）
	viper.SetEnvPrefix("TAIZHANG")
	viper.AutomaticEnv()
	viper.BindEnv("database.dsn", "TAIZHANG_DATABASE_DSN")
	viper.BindEnv("thirdparty.park_id", "TAIZHANG_PARK_ID")
	viper.BindEnv("thirdparty.base_url", "TAIZHANG_BASE_URL")
	viper.BindEnv("oss.endpoint", "TAIZHANG_OSS_ENDPOINT")
	viper.BindEnv("oss.access_key_id", "TAIZHANG_OSS_ACCESS_KEY_ID")
	viper.BindEnv("oss.access_key_secret", "TAIZHANG_OSS_ACCESS_KEY_SECRET")
	viper.BindEnv("oss.bucket_name", "TAIZHANG_OSS_BUCKET_NAME")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Config file not found, using defaults and environment variables: %v", err)
	}

	cfg = &Config{
		Server: ServerConfig{
			Port: viper.GetString("server.port"),
			Mode: viper.GetString("server.mode"),
		},
		Database: DatabaseConfig{
			DSN: viper.GetString("database.dsn"),
		},
		ThirdParty: ThirdPartyConfig{
			ParkID:  viper.GetString("thirdparty.park_id"),
			BaseURL: viper.GetString("thirdparty.base_url"),
		},
		OSS: OSSConfig{
			Endpoint:        viper.GetString("oss.endpoint"),
			AccessKeyID:     viper.GetString("oss.access_key_id"),
			AccessKeySecret: viper.GetString("oss.access_key_secret"),
			BucketName:      viper.GetString("oss.bucket_name"),
		},
	}

	// 检查必要的环境变量
	if cfg.Database.DSN == "" {
		log.Fatal("Database DSN is required")
	}

	return cfg
}

func Get() *Config {
	return cfg
}
