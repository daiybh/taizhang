package main

import (
	"fmt"
	"log"
	"strings"
	"taizhang-server/internal/config"
	"taizhang-server/internal/handler"
	"taizhang-server/internal/middleware"
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
	"taizhang-server/internal/service"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 根据运行模式设置日志级别
	var logLevel logger.LogLevel
	if cfg.Server.Mode == "debug" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Error
	}

	// 自动创建数据库（如果不存在）
	if err := createDatabaseIfNotExists(cfg.Database.DSN); err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}

	// 初始化数据库（带重试机制）
	var db *gorm.DB
	var err error
	for i := 0; i < 3; i++ {
		db, err = gorm.Open(mysql.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logLevel),
		})
		if err == nil {
			break
		}
		if i < 2 {
			log.Printf("Failed to connect database (attempt %d/3), retrying...: %v", i+1, err)
			time.Sleep(time.Duration(i+1) * time.Second)
		}
	}
	if err != nil {
		log.Fatalf("Failed to connect database after 3 attempts: %v", err)
	}

	// 自动迁移数据库表结构
	if err := autoMigrate(db); err != nil {
		log.Fatalf("Failed to auto migrate database: %v", err)
	}

	// 配置数据库连接池
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 初始化仓库
	repos := repository.New(db)

	// 初始化服务
	services := service.New(repos, cfg)

	// 初始化处理器
	handlers := handler.New(services)

	// 创建路由
	r := gin.Default()

	// 添加中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logging())

	// 注册路由
	setupRoutes(r, handlers)

	// 启动服务器
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(r *gin.Engine, h *handler.Handler) {
	// 管理层API
	apiV1 := r.Group("/api/v1")
	{
		// 车场管理
		parkGroup := apiV1.Group("/parks")
		{
			parkGroup.POST("", h.Park.Create)
			parkGroup.GET("", h.Park.List)
			parkGroup.GET("/:id", h.Park.Get)
			parkGroup.PUT("/:id", h.Park.Update)
			parkGroup.DELETE("/:id", h.Park.Delete)
			parkGroup.POST("/:id/renew", h.Park.Renew)
			parkGroup.GET("/:id/download", h.Park.DownloadInfo)
		}

		// 续费记录
		renewalGroup := apiV1.Group("/renewals")
		{
			renewalGroup.GET("", h.Renewal.List)
		}

		// 车场层API
		// 公司管理
		companyGroup := apiV1.Group("/companies")
		{
			companyGroup.POST("", h.Company.Create)
			companyGroup.GET("", h.Company.List)
			companyGroup.GET("/:id", h.Company.Get)
			companyGroup.PUT("/:id", h.Company.Update)
			companyGroup.DELETE("/:id", h.Company.Delete)
		}

		// 二维码管理
		qrcodeGroup := apiV1.Group("/qrcodes")
		{
			qrcodeGroup.GET("/external-vehicle", h.QRCode.GetExternalVehicle)
			qrcodeGroup.POST("/external-vehicle/update", h.QRCode.UpdateExternalVehicle)
			qrcodeGroup.GET("/internal-vehicle", h.QRCode.GetInternalVehicle)
			qrcodeGroup.POST("/internal-vehicle/update", h.QRCode.UpdateInternalVehicle)
			qrcodeGroup.GET("/non-road", h.QRCode.GetNonRoad)
			qrcodeGroup.POST("/non-road/update", h.QRCode.UpdateNonRoad)
		}

		// 厂外运输车辆
		externalVehicleGroup := apiV1.Group("/external-vehicles")
		{
			externalVehicleGroup.POST("", h.ExternalVehicle.Create)
			externalVehicleGroup.GET("", h.ExternalVehicle.List)
			externalVehicleGroup.GET("/:id", h.ExternalVehicle.Get)
			externalVehicleGroup.PUT("/:id", h.ExternalVehicle.Update)
			externalVehicleGroup.DELETE("/:id", h.ExternalVehicle.Delete)
			externalVehicleGroup.POST("/audit", h.ExternalVehicle.Audit)
			externalVehicleGroup.POST("/dispatch", h.ExternalVehicle.Dispatch)
		}

		// 厂内运输车辆
		internalVehicleGroup := apiV1.Group("/internal-vehicles")
		{
			internalVehicleGroup.POST("", h.InternalVehicle.Create)
			internalVehicleGroup.GET("", h.InternalVehicle.List)
			internalVehicleGroup.GET("/:id", h.InternalVehicle.Get)
			internalVehicleGroup.PUT("/:id", h.InternalVehicle.Update)
			internalVehicleGroup.DELETE("/:id", h.InternalVehicle.Delete)
			internalVehicleGroup.POST("/dispatch", h.InternalVehicle.Dispatch)
		}

		// 非道路移动机械
		nonRoadGroup := apiV1.Group("/non-road")
		{
			nonRoadGroup.POST("", h.NonRoad.Create)
			nonRoadGroup.GET("", h.NonRoad.List)
			nonRoadGroup.GET("/:id", h.NonRoad.Get)
			nonRoadGroup.PUT("/:id", h.NonRoad.Update)
			nonRoadGroup.DELETE("/:id", h.NonRoad.Delete)
			nonRoadGroup.POST("/dispatch", h.NonRoad.Dispatch)
		}

		// 用户权限
		userGroup := apiV1.Group("/users")
		{
			userGroup.POST("", h.User.Create)
			userGroup.GET("", h.User.List)
			userGroup.GET("/:id", h.User.Get)
			userGroup.PUT("/:id", h.User.Update)
			userGroup.DELETE("/:id", h.User.Delete)
		}

		// 角色管理
		roleGroup := apiV1.Group("/roles")
		{
			roleGroup.POST("", h.Role.Create)
			roleGroup.GET("", h.Role.List)
			roleGroup.GET("/:id", h.Role.Get)
			roleGroup.PUT("/:id", h.Role.Update)
			roleGroup.DELETE("/:id", h.Role.Delete)
		}

		// 部门管理
		departmentGroup := apiV1.Group("/departments")
		{
			departmentGroup.POST("", h.Department.Create)
			departmentGroup.GET("", h.Department.List)
			departmentGroup.GET("/:id", h.Department.Get)
			departmentGroup.PUT("/:id", h.Department.Update)
			departmentGroup.DELETE("/:id", h.Department.Delete)
		}

		// 车主端小程序API
		miniProgram := apiV1.Group("/mini-program")
		{
			// 扫码登记
			miniProgram.POST("/scan", h.MiniProgram.Scan)
			// 车辆信息提交
			miniProgram.POST("/vehicle", h.MiniProgram.SubmitVehicle)
			// 获取第三方随车清单数据
			miniProgram.POST("/get-car-data", h.MiniProgram.GetCarData)
		}

		// PC端插件API
		plugin := apiV1.Group("/plugin")
		{
			plugin.POST("/verify", h.Plugin.Verify)
			plugin.POST("/sync", h.Plugin.Sync)
		}
	}
}

// autoMigrate 自动迁移数据库表结构
func autoMigrate(db *gorm.DB) error {
	log.Println("Starting database auto migration...")
	return db.AutoMigrate(
		&model.Park{},
		&model.Company{},
		&model.RenewalRecord{},
		&model.ExternalVehicle{},
		&model.InternalVehicle{},
		&model.NonRoadMachinery{},
		&model.User{},
		&model.Role{},
		&model.Department{},
		&model.QRCode{},
		&model.PluginAuth{},
	)
}

// createDatabaseIfNotExists 创建数据库（如果不存在）
func createDatabaseIfNotExists(dsn string) error {
	// 解析DSN,提取数据库名
	// DSN格式: username:password@tcp(host:port)/database?charset=utf8mb4&parseTime=True&loc=Local
	var dbName string
	var dsnWithoutDB string

	// 查找 '/' 后面的数据库名
	slashIndex := strings.LastIndex(dsn, "/")
	if slashIndex == -1 {
		return fmt.Errorf("invalid DSN format")
	}

	// 提取数据库名（可能包含参数）
	dbPart := dsn[slashIndex+1:]
	questionIndex := strings.Index(dbPart, "?")

	if questionIndex == -1 {
		dbName = dbPart
		dsnWithoutDB = dsn[:slashIndex] + "/"
	} else {
		dbName = dbPart[:questionIndex]
		dsnWithoutDB = dsn[:slashIndex] + "/" + dbPart[questionIndex:]
	}

	if dbName == "" {
		return fmt.Errorf("database name not found in DSN")
	}

	log.Printf("Checking database '%s'...", dbName)

	// 连接到MySQL服务器（不指定数据库）
	db, err := gorm.Open(mysql.Open(dsnWithoutDB), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL server: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}
	defer sqlDB.Close()

	// 创建数据库
	createSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)
	if err := db.Exec(createSQL).Error; err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}

	log.Printf("Database '%s' ready", dbName)
	return nil
}
