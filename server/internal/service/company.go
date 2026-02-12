
package service

import (
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type CompanyService struct {
	repo *repository.Repository
}

func NewCompanyService(repo *repository.Repository) *CompanyService {
	return &CompanyService{
		repo: repo,
	}
}

func (s *CompanyService) Create(company *model.Company) error {
	return s.repo.DB.Create(company).Error
}

func (s *CompanyService) GetByID(id uint) (*model.Company, error) {
	var company model.Company
	err := s.repo.DB.First(&company, id).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (s *CompanyService) List(parkID uint, name string, page, pageSize int) ([]model.Company, int64, error) {
	var companies []model.Company
	var total int64

	query := s.repo.DB.Model(&model.Company{}).Where("park_id = ?", parkID)

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&companies).Error
	if err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

func (s *CompanyService) Update(company *model.Company) error {
	return s.repo.DB.Save(company).Error
}

func (s *CompanyService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.Company{}, id).Error
}
