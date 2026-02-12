
package service

import (
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type RenewalService struct {
	repo *repository.Repository
}

func NewRenewalService(repo *repository.Repository) *RenewalService {
	return &RenewalService{
		repo: repo,
	}
}

func (s *RenewalService) List(parkName, parkCode string, page, pageSize int) ([]model.RenewalRecord, int64, error) {
	var records []model.RenewalRecord
	var total int64

	query := s.repo.DB.Model(&model.RenewalRecord{})

	if parkName != "" {
		query = query.Joins("JOIN parks ON renewal_records.park_id = parks.id").
			Where("parks.name LIKE ?", "%"+parkName+"%")
	}
	if parkCode != "" {
		query = query.Joins("JOIN parks ON renewal_records.park_id = parks.id").
			Where("parks.code LIKE ?", "%"+parkCode+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Preload("Park").Offset(offset).Limit(pageSize).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	return records, total, nil
}
