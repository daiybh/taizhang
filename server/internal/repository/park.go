package repository

import (
	"taizhang-server/internal/model"
	"time"

	"gorm.io/gorm"
)

type ParkRepository struct {
	*Repository
}

func NewParkRepository(db *gorm.DB) *ParkRepository {
	return &ParkRepository{
		Repository: New(db),
	}
}

func (r *ParkRepository) Create(park *model.Park) error {
	return r.DB.Create(park).Error
}

func (r *ParkRepository) GetByID(id uint) (*model.Park, error) {
	var park model.Park
	err := r.DB.First(&park, id).Error
	if err != nil {
		return nil, err
	}
	return &park, nil
}

func (r *ParkRepository) GetByCode(code string) (*model.Park, error) {
	var park model.Park
	err := r.DB.Where("code = ?", code).First(&park).Error
	if err != nil {
		return nil, err
	}
	return &park, nil
}

func (r *ParkRepository) List(name, code string, page, pageSize int) ([]model.Park, int64, error) {
	var parks []model.Park
	var total int64

	query := r.DB.Model(&model.Park{})

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if code != "" {
		query = query.Where("code LIKE ?", "%"+code+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&parks).Error
	if err != nil {
		return nil, 0, err
	}

	return parks, total, nil
}

func (r *ParkRepository) Update(park *model.Park) error {
	return r.DB.Save(park).Error
}

func (r *ParkRepository) Delete(id uint) error {
	return r.DB.Delete(&model.Park{}, id).Error
}

func (r *ParkRepository) CheckValidity(parkID uint) (bool, error) {
	var park model.Park
	err := r.DB.First(&park, parkID).Error
	if err != nil {
		return false, err
	}

	now := time.Now()
	return park.StartTime.Before(now) && park.EndTime.After(now), nil
}

func (r *ParkRepository) Renew(parkID uint, duration int) (*model.Park, error) {
	var park model.Park
	err := r.DB.First(&park, parkID).Error
	if err != nil {
		return nil, err
	}

	// 记录续费前的结束时间
	oldEndTime := park.EndTime

	// 更新结束时间
	park.EndTime = park.EndTime.AddDate(0, duration, 0)

	err = r.DB.Save(&park).Error
	if err != nil {
		return nil, err
	}

	// 创建续费记录
	renewalRecord := &model.RenewalRecord{
		ParkID:      parkID,
		OldEndTime:  oldEndTime,
		NewEndTime:  park.EndTime,
		Duration:    duration,
		RenewalTime: time.Now(),
	}
	err = r.DB.Create(renewalRecord).Error
	if err != nil {
		return nil, err
	}

	return &park, nil
}
