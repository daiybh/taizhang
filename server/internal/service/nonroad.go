
package service

import (
	"time"

	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type NonRoadService struct {
	repo *repository.Repository
}

func NewNonRoadService(repo *repository.Repository) *NonRoadService {
	return &NonRoadService{
		repo: repo,
	}
}

func (s *NonRoadService) Create(machinery *model.NonRoadMachinery) error {
	return s.repo.DB.Create(machinery).Error
}

func (s *NonRoadService) GetByID(id uint) (*model.NonRoadMachinery, error) {
	var machinery model.NonRoadMachinery
	err := s.repo.DB.First(&machinery, id).Error
	if err != nil {
		return nil, err
	}
	return &machinery, nil
}

func (s *NonRoadService) List(parkID uint, environmentalCode, licensePlate, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.NonRoadMachinery, int64, error) {
	var machineryList []model.NonRoadMachinery
	var total int64

	query := s.repo.DB.Model(&model.NonRoadMachinery{}).Where("park_id = ?", parkID)

	if environmentalCode != "" {
		query = query.Where("environmental_code LIKE ?", "%"+environmentalCode+"%")
	}
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
	err = query.Offset(offset).Limit(pageSize).Find(&machineryList).Error
	if err != nil {
		return nil, 0, err
	}

	return machineryList, total, nil
}

func (s *NonRoadService) Update(machinery *model.NonRoadMachinery) error {
	return s.repo.DB.Save(machinery).Error
}

func (s *NonRoadService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.NonRoadMachinery{}, id).Error
}

func (s *NonRoadService) Dispatch(id uint) error {
	now := time.Now()
	return s.repo.DB.Model(&model.NonRoadMachinery{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
	}).Error
}

func (s *NonRoadService) BatchDispatch(ids []uint) error {
	now := time.Now()
	return s.repo.DB.Model(&model.NonRoadMachinery{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"dispatch_status": "dispatched",
			"dispatch_time":   &now,
		}).Error
}
