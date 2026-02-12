package service

import (
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
	"time"
)

type InternalVehicleService struct {
	repo *repository.Repository
}

func NewInternalVehicleService(repo *repository.Repository) *InternalVehicleService {
	return &InternalVehicleService{
		repo: repo,
	}
}

func (s *InternalVehicleService) Create(vehicle *model.InternalVehicle) error {
	return s.repo.DB.Create(vehicle).Error
}

func (s *InternalVehicleService) GetByID(id uint) (*model.InternalVehicle, error) {
	var vehicle model.InternalVehicle
	err := s.repo.DB.First(&vehicle, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (s *InternalVehicleService) List(parkID uint, licensePlate, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.InternalVehicle, int64, error) {
	var vehicles []model.InternalVehicle
	var total int64

	query := s.repo.DB.Model(&model.InternalVehicle{}).Where("park_id = ?", parkID)

	if licensePlate != "" {
		query = query.Where("license_plate LIKE ?", "%"+licensePlate+"%")
	}
	if dispatchStatus != "" {
		query = query.Where("dispatch_status = ?", dispatchStatus)
	}
	if emissionStandard != "" {
		query = query.Where("emission_standard = ?", emissionStandard)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&vehicles).Error
	if err != nil {
		return nil, 0, err
	}

	return vehicles, total, nil
}

func (s *InternalVehicleService) Update(vehicle *model.InternalVehicle) error {
	return s.repo.DB.Save(vehicle).Error
}

func (s *InternalVehicleService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.InternalVehicle{}, id).Error
}

func (s *InternalVehicleService) Dispatch(id uint) error {
	now := time.Now()
	return s.repo.DB.Model(&model.InternalVehicle{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
	}).Error
}

func (s *InternalVehicleService) BatchDispatch(ids []uint) error {
	now := time.Now()
	return s.repo.DB.Model(&model.InternalVehicle{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"dispatch_status": "dispatched",
			"dispatch_time":   &now,
		}).Error
}
