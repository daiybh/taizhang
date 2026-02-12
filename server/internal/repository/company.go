
package repository

import (
	"taizhang-server/internal/model"

	"gorm.io/gorm"
)

type CompanyRepository struct {
	*Repository
}

func NewCompanyRepository(db *gorm.DB) *CompanyRepository {
	return &CompanyRepository{
		Repository: New(db),
	}
}

func (r *CompanyRepository) Create(company *model.Company) error {
	return r.DB.Create(company).Error
}

func (r *CompanyRepository) GetByID(id uint) (*model.Company, error) {
	var company model.Company
	err := r.DB.First(&company, id).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *CompanyRepository) List(parkID uint, name string, page, pageSize int) ([]model.Company, int64, error) {
	var companies []model.Company
	var total int64

	query := r.DB.Model(&model.Company{}).Where("park_id = ?", parkID)

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

func (r *CompanyRepository) Update(company *model.Company) error {
	return r.DB.Save(company).Error
}

func (r *CompanyRepository) Delete(id uint) error {
	return r.DB.Delete(&model.Company{}, id).Error
}
