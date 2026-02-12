
package service

import (
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type DepartmentService struct {
	repo *repository.Repository
}

func NewDepartmentService(repo *repository.Repository) *DepartmentService {
	return &DepartmentService{
		repo: repo,
	}
}

func (s *DepartmentService) Create(department *model.Department) error {
	return s.repo.DB.Create(department).Error
}

func (s *DepartmentService) GetByID(id uint) (*model.Department, error) {
	var department model.Department
	err := s.repo.DB.First(&department, id).Error
	if err != nil {
		return nil, err
	}
	return &department, nil
}

func (s *DepartmentService) List(parkID uint, page, pageSize int) ([]model.Department, int64, error) {
	var departments []model.Department
	var total int64

	query := s.repo.DB.Model(&model.Department{}).Where("park_id = ?", parkID)

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&departments).Error
	if err != nil {
		return nil, 0, err
	}

	return departments, total, nil
}

func (s *DepartmentService) Update(department *model.Department) error {
	return s.repo.DB.Save(department).Error
}

func (s *DepartmentService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.Department{}, id).Error
}
