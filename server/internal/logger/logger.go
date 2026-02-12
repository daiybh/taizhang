package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	// 全局日志记录器
	infoLogger  *log.Logger
	errorLogger *log.Logger

	// 当前日志文件
	currentLogFile   *os.File
	currentDate      string
	logDir           string
	logRetentionDays int
	mu               sync.Mutex
)

// Init 初始化日志系统
func Init(dir string, retentionDays int) error {
	logDir = dir
	logRetentionDays = retentionDays

	// 创建日志目录
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	// 初始化日志文件
	if err := rotateLogFile(); err != nil {
		return err
	}

	// 定期检查是否需要轮转
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			mu.Lock()
			if needRotate() {
				if err := rotateLogFile(); err != nil {
					log.Printf("Failed to rotate log file: %v", err)
				}
			}
			mu.Unlock()
		}
	}()

	// 定期清理旧日志
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			cleanOldLogs()
		}
	}()

	return nil
}

// needRotate 检查是否需要轮转日志
func needRotate() bool {
	today := time.Now().Format("2006-01-02")
	return currentDate != today
}

// rotateLogFile 轮转日志文件
func rotateLogFile() error {
	// 关闭旧文件
	if currentLogFile != nil {
		currentLogFile.Close()
	}

	// 生成新文件名
	currentDate = time.Now().Format("2006-01-02")
	logFileName := filepath.Join(logDir, fmt.Sprintf("server-%s.log", currentDate))

	// 打开或创建日志文件
	file, err := os.OpenFile(logFileName, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	currentLogFile = file

	// 创建多写入器：同时写入文件和控制台
	multiWriter := io.MultiWriter(os.Stdout, file)

	// 配置日志记录器
	infoLogger = log.New(multiWriter, "[INFO] ", log.LstdFlags)
	errorLogger = log.New(multiWriter, "[ERROR] ", log.LstdFlags)

	// 同时设置标准日志输出
	log.SetOutput(multiWriter)
	log.SetFlags(log.LstdFlags)

	log.Printf("日志文件已轮转: %s", logFileName)

	return nil
}

// cleanOldLogs 清理过期的日志文件
func cleanOldLogs() {
	if logRetentionDays <= 0 {
		return // 0 或负数表示不清理
	}

	cutoffDate := time.Now().AddDate(0, 0, -logRetentionDays)

	files, err := os.ReadDir(logDir)
	if err != nil {
		log.Printf("Failed to read log directory: %v", err)
		return
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		// 只处理日志文件
		if filepath.Ext(file.Name()) != ".log" {
			continue
		}

		info, err := file.Info()
		if err != nil {
			continue
		}

		// 如果文件修改时间早于截止日期，则删除
		if info.ModTime().Before(cutoffDate) {
			filePath := filepath.Join(logDir, file.Name())
			if err := os.Remove(filePath); err != nil {
				log.Printf("Failed to remove old log file %s: %v", filePath, err)
			} else {
				log.Printf("已删除旧日志文件: %s", filePath)
			}
		}
	}
}

// Info 记录信息日志
func Info(format string, v ...interface{}) {
	mu.Lock()
	defer mu.Unlock()

	if infoLogger != nil {
		infoLogger.Printf(format, v...)
	} else {
		log.Printf("[INFO] "+format, v...)
	}
}

// Error 记录错误日志
func Error(format string, v ...interface{}) {
	mu.Lock()
	defer mu.Unlock()

	if errorLogger != nil {
		errorLogger.Printf(format, v...)
	} else {
		log.Printf("[ERROR] "+format, v...)
	}
}

// Printf 兼容标准 log.Printf
func Printf(format string, v ...interface{}) {
	mu.Lock()
	defer mu.Unlock()

	if infoLogger != nil {
		infoLogger.Printf(format, v...)
	} else {
		log.Printf(format, v...)
	}
}

// Close 关闭日志系统
func Close() {
	mu.Lock()
	defer mu.Unlock()

	if currentLogFile != nil {
		currentLogFile.Close()
		currentLogFile = nil
	}
}
