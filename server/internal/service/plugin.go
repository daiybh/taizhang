
package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type PluginService struct {
	repo *repository.Repository
}

func NewPluginService(repo *repository.Repository) *PluginService {
	return &PluginService{
		repo: repo,
	}
}

// Verify PC端插件验证
func (s *PluginService) Verify(parkID uint, timestamp int64, signature string) (*model.Park, error) {
	// 获取车场信息
	var park model.Park
	err := s.repo.DB.First(&park, parkID).Error
	if err != nil {
		return nil, err
	}

	// 验证时间戳（5分钟内有效）
	now := time.Now().Unix()
	if now-timestamp > 300 || timestamp-now > 300 {
		return nil, fmt.Errorf("timestamp expired")
	}

	// 验证签名
	expectedSignature := s.generateSignature(park.SecretKey, timestamp)
	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return nil, fmt.Errorf("invalid signature")
	}

	// 检查车场有效期
	if park.StartTime.After(time.Now()) || park.EndTime.Before(time.Now()) {
		return nil, fmt.Errorf("park has expired")
	}

	return &park, nil
}

// Sync 同步数据
func (s *PluginService) Sync(parkID uint, dataType string, data interface{}) error {
	// 根据数据类型处理不同的同步逻辑
	switch dataType {
	case "external-vehicle":
		// 处理厂外运输车辆数据同步
	case "internal-vehicle":
		// 处理厂内运输车辆数据同步
	case "non-road":
		// 处理非道路移动机械数据同步
	default:
		return fmt.Errorf("unsupported data type")
	}

	return nil
}

// generateSignature 生成签名
func (s *PluginService) generateSignature(secretKey string, timestamp int64) string {
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(fmt.Sprintf("%d", timestamp)))
	return hex.EncodeToString(h.Sum(nil))
}
