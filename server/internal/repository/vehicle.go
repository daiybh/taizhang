package repository

import (
	"taizhang-server/internal/model"
	"time"

	"gorm.io/gorm"
)

type VehicleRepository struct {
	*Repository
}

func NewVehicleRepository(db *gorm.DB) *VehicleRepository {
	return &VehicleRepository{
		Repository: New(db),
	}
}

// 厂外运输车辆
func (r *VehicleRepository) CreateExternalVehicle(vehicle *model.ExternalVehicle) error {
	return r.DB.Create(vehicle).Error
}

func (r *VehicleRepository) GetExternalVehicleByID(id uint) (*model.ExternalVehicle, error) {
	var vehicle model.ExternalVehicle
	err := r.DB.Preload("Company").First(&vehicle, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (r *VehicleRepository) ListExternalVehicles(parkID uint, licensePlate, auditStatus, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.ExternalVehicle, int64, error) {
	var vehicles []model.ExternalVehicle
	var total int64

	query := r.DB.Model(&model.ExternalVehicle{}).Where("park_id = ?", parkID)

	if licensePlate != "" {
		query = query.Where("license_plate LIKE ?", "%"+licensePlate+"%")
	}
	if auditStatus != "" {
		query = query.Where("audit_status = ?", auditStatus)
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
	err = query.Preload("Company").Offset(offset).Limit(pageSize).Find(&vehicles).Error
	if err != nil {
		return nil, 0, err
	}

	return vehicles, total, nil
}

func (r *VehicleRepository) UpdateExternalVehicle(vehicle *model.ExternalVehicle) error {
	return r.DB.Save(vehicle).Error
}

func (r *VehicleRepository) DeleteExternalVehicle(id uint) error {
	return r.DB.Delete(&model.ExternalVehicle{}, id).Error
}

func (r *VehicleRepository) AuditExternalVehicle(id uint, status string) error {
	return r.DB.Model(&model.ExternalVehicle{}).Where("id = ?", id).Update("audit_status", status).Error
}

func (r *VehicleRepository) DispatchExternalVehicle(id uint) error {
	now := time.Now()
	return r.DB.Model(&model.ExternalVehicle{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
		"dispatch_count":  gorm.Expr("dispatch_count + 1"),
	}).Error
}

// 厂内运输车辆
func (r *VehicleRepository) CreateInternalVehicle(vehicle *model.InternalVehicle) error {
	return r.DB.Create(vehicle).Error
}

func (r *VehicleRepository) GetInternalVehicleByID(id uint) (*model.InternalVehicle, error) {
	var vehicle model.InternalVehicle
	err := r.DB.First(&vehicle, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (r *VehicleRepository) ListInternalVehicles(parkID uint, licensePlate, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.InternalVehicle, int64, error) {
	var vehicles []model.InternalVehicle
	var total int64

	query := r.DB.Model(&model.InternalVehicle{}).Where("park_id = ?", parkID)

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

func (r *VehicleRepository) UpdateInternalVehicle(vehicle *model.InternalVehicle) error {
	return r.DB.Save(vehicle).Error
}

func (r *VehicleRepository) DeleteInternalVehicle(id uint) error {
	return r.DB.Delete(&model.InternalVehicle{}, id).Error
}

func (r *VehicleRepository) DispatchInternalVehicle(id uint) error {
	now := time.Now()
	return r.DB.Model(&model.InternalVehicle{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
	}).Error
}

// 非道路移动机械
func (r *VehicleRepository) CreateNonRoadMachinery(machinery *model.NonRoadMachinery) error {
	return r.DB.Create(machinery).Error
}

func (r *VehicleRepository) GetNonRoadMachineryByID(id uint) (*model.NonRoadMachinery, error) {
	var machinery model.NonRoadMachinery
	err := r.DB.First(&machinery, id).Error
	if err != nil {
		return nil, err
	}
	return &machinery, nil
}

func (r *VehicleRepository) ListNonRoadMachinery(parkID uint, environmentalCode, licensePlate, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.NonRoadMachinery, int64, error) {
	var machineryList []model.NonRoadMachinery
	var total int64

	query := r.DB.Model(&model.NonRoadMachinery{}).Where("park_id = ?", parkID)

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

func (r *VehicleRepository) UpdateNonRoadMachinery(machinery *model.NonRoadMachinery) error {
	return r.DB.Save(machinery).Error
}

func (r *VehicleRepository) DeleteNonRoadMachinery(id uint) error {
	return r.DB.Delete(&model.NonRoadMachinery{}, id).Error
}

func (r *VehicleRepository) DispatchNonRoadMachinery(id uint) error {
	now := time.Now()
	return r.DB.Model(&model.NonRoadMachinery{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
	}).Error
}
