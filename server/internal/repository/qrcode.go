
package repository

import (
	"taizhang-server/internal/model"

	"gorm.io/gorm"
)

type QRCodeRepository struct {
	*Repository
}

func NewQRCodeRepository(db *gorm.DB) *QRCodeRepository {
	return &QRCodeRepository{
		Repository: New(db),
	}
}

func (r *QRCodeRepository) GetByParkIDAndType(parkID uint, qrcodeType string) (*model.QRCode, error) {
	var qrcode model.QRCode
	err := r.DB.Where("park_id = ? AND type = ?", parkID, qrcodeType).First(&qrcode).Error
	if err != nil {
		return nil, err
	}
	return &qrcode, nil
}

func (r *QRCodeRepository) Create(qrcode *model.QRCode) error {
	return r.DB.Create(qrcode).Error
}

func (r *QRCodeRepository) Update(qrcode *model.QRCode) error {
	return r.DB.Save(qrcode).Error
}

func (r *QRCodeRepository) UpdateContent(parkID uint, qrcodeType, content string) error {
	return r.DB.Model(&model.QRCode{}).
		Where("park_id = ? AND type = ?", parkID, qrcodeType).
		Update("content", content).Error
}
