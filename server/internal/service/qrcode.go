
package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type QRCodeService struct {
	repo *repository.Repository
}

func NewQRCodeService(repo *repository.Repository) *QRCodeService {
	return &QRCodeService{
		repo: repo,
	}
}

func (s *QRCodeService) GetByParkIDAndType(parkID uint, qrcodeType string) (*model.QRCode, error) {
	var qrcode model.QRCode
	err := s.repo.DB.Where("park_id = ? AND type = ?", parkID, qrcodeType).First(&qrcode).Error
	if err != nil {
		return nil, err
	}
	return &qrcode, nil
}

func (s *QRCodeService) GenerateQRCode(parkID uint, qrcodeType string) (*model.QRCode, error) {
	// 生成随机二维码内容
	content, err := generateRandomContent()
	if err != nil {
		return nil, err
	}

	qrcode := &model.QRCode{
		ParkID:   parkID,
		Type:     qrcodeType,
		Content:  content,
		IsEnabled: true,
	}

	err = s.repo.DB.Create(qrcode).Error
	if err != nil {
		return nil, err
	}

	return qrcode, nil
}

func (s *QRCodeService) UpdateQRCode(parkID uint, qrcodeType string) (*model.QRCode, error) {
	// 生成新的二维码内容
	content, err := generateRandomContent()
	if err != nil {
		return nil, err
	}

	// 更新二维码内容
	err = s.repo.DB.Model(&model.QRCode{}).
		Where("park_id = ? AND type = ?", parkID, qrcodeType).
		Update("content", content).Error
	if err != nil {
		return nil, err
	}

	return s.GetByParkIDAndType(parkID, qrcodeType)
}

func (s *QRCodeService) UpdateFieldsConfig(parkID uint, qrcodeType string, fieldsConfig string) error {
	return s.repo.DB.Model(&model.QRCode{}).
		Where("park_id = ? AND type = ?", parkID, qrcodeType).
		Update("fields_config", fieldsConfig).Error
}

// generateRandomContent 生成随机二维码内容
func generateRandomContent() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("park:%s", hex.EncodeToString(bytes)), nil
}
