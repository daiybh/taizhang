
package service

import (
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type RoleService struct {
	repo *repository.Repository
}

func NewRoleService(repo *repository.Repository) *RoleService {
	return &RoleService{
		repo: repo,
	}
}

func (s *RoleService) Create(role *model.Role) error {
	return s.repo.DB.Create(role).Error
}

func (s *RoleService) GetByID(id uint) (*model.Role, error) {
	var role model.Role
	err := s.repo.DB.First(&role, id).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (s *RoleService) List(parkID uint, page, pageSize int) ([]model.Role, int64, error) {
	var roles []model.Role
	var total int64

	query := s.repo.DB.Model(&model.Role{}).Where("park_id = ?", parkID)

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&roles).Error
	if err != nil {
		return nil, 0, err
	}

	return roles, total, nil
}

func (s *RoleService) Update(role *model.Role) error {
	return s.repo.DB.Save(role).Error
}

func (s *RoleService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.Role{}, id).Error
}
