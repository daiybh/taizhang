package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"taizhang-server/internal/config"
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"

	"gorm.io/gorm"
)

type ExternalVehicleService struct {
	repo *repository.Repository
	cfg  *config.Config
}

func NewExternalVehicleService(repo *repository.Repository, cfg *config.Config) *ExternalVehicleService {
	return &ExternalVehicleService{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *ExternalVehicleService) ValidateLicensePlate(plate string) error {
	// 校验车牌位数在7位、8位且第二位字符必须是A-Z的字母
	if len(plate) != 7 && len(plate) != 8 {
		return fmt.Errorf("车牌号码位数不正确")
	}

	// 第二位字符必须是A-Z的字母
	matched, err := regexp.MatchString(`^[A-Za-z][A-Z][A-Za-z0-9]{5,6}$`, plate)
	if err != nil {
		return err
	}
	if !matched {
		return fmt.Errorf("车牌号码格式不正确，第二位必须是A-Z的字母")
	}

	return nil
}

func (s *ExternalVehicleService) DeterminePlateColor(plate string, vehicleType string) string {
	plateLen := len(plate)

	// 4.1 ocr车牌号码位数=8且第8位字符=A-Z，则车牌颜色=新能源绿黄牌
	if plateLen == 8 && isLetter(plate[7]) {
		return "新能源绿黄牌"
	}

	// 4.2 ocr车牌号码位数=8且第8位字符=0-9，则车牌颜色=新能源绿牌
	if plateLen == 8 && isDigit(plate[7]) {
		return "新能源绿牌"
	}

	// 4.3 ocr车牌号码位数=7，且车辆类型包含：重型、中型，车牌颜色=黄牌
	if plateLen == 7 && (strings.Contains(vehicleType, "重型") || strings.Contains(vehicleType, "中型")) {
		return "黄牌"
	}

	// 4.4 ocr车牌号码位数=7，且车辆类型包含：轻型，车牌颜色=蓝牌
	if plateLen == 7 && strings.Contains(vehicleType, "轻型") {
		return "蓝牌"
	}

	// 4.5 else 车牌颜色=蓝牌
	return "蓝牌"
}

func (s *ExternalVehicleService) ValidateDate(dateStr string) error {
	// 校验格式YYYY-MM-DD
	matched, err := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, dateStr)
	if err != nil {
		return err
	}
	if !matched {
		return fmt.Errorf("日期格式不正确，应为YYYY-MM-DD")
	}

	// 验证日期是否有效
	_, err = time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("日期不正确")
	}

	return nil
}

func (s *ExternalVehicleService) ValidateVIN(vin string) error {
	if len(vin) != 17 {
		return fmt.Errorf("车辆识别代号必须是17位")
	}
	return nil
}

func (s *ExternalVehicleService) ValidateVehicleType(vehicleType string) error {
	// 车辆类型最后一位字符必须是"车"
	if len(vehicleType) == 0 || vehicleType[len(vehicleType)-1:] != "车" {
		return fmt.Errorf("车辆类型错误，最后一位必须是'车'")
	}
	return nil
}

func (s *ExternalVehicleService) ValidateRequiredFields(vehicle *model.ExternalVehicle) error {
	if vehicle.BrandModel == "" {
		return fmt.Errorf("品牌型号不能为空")
	}
	if vehicle.UsageNature == "" {
		return fmt.Errorf("使用性质不能为空")
	}
	if vehicle.Owner == "" {
		return fmt.Errorf("所有人不能为空")
	}
	if vehicle.Address == "" {
		return fmt.Errorf("住址不能为空")
	}

	// 核定载质量、准牵引总质量其中一个数据不为空则符合要求；都为空，默认核定载质量40000KG
	if vehicle.ApprovedLoadMass == nil && vehicle.MaxTowingMass == nil {
		defaultMass := 40000.0
		vehicle.ApprovedLoadMass = &defaultMass
	}

	return nil
}

func (s *ExternalVehicleService) GetThirdPartyData(plate, vin, engineNumber, vehicleType string) (*model.ThirdPartyVehicleData, error) {
	// 调用第三方API获取随车清单数据
	url := fmt.Sprintf("%s/get_car_data", s.cfg.ThirdParty.BaseURL)

	reqBody := map[string]interface{}{
		"park_id":     s.cfg.ThirdParty.ParkID,
		"car_number":  plate,
		"vin":         vin,
		"motor":       engineNumber,
		"VehicleType": vehicleType,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	// 创建带超时的 HTTP 客户端
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 实现重试逻辑（最多3次，指数退避）
	var resp *http.Response
	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		resp, err = client.Post(url, "application/json", bytes.NewBuffer(jsonData))
		if err == nil {
			break
		}
		if i < maxRetries-1 {
			sleepDuration := time.Duration(1<<uint(i)) * time.Second
			time.Sleep(sleepDuration)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("failed to call third party API after %d retries: %v", maxRetries, err)
	}
	defer resp.Body.Close()

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("third party API returned status %d", resp.StatusCode)
	}

	var result struct {
		State int `json:"state"`
		Data  struct {
			OSS          string `json:"oss"`
			PFJD         string `json:"pfjd"` // 排放阶段
			VIN          string `json:"vin"`
			Type         int    `json:"type"`
			MotorCompany string `json:"motor_company"` // 发动机生产厂
			MotorXH      string `json:"motor_xh"`      // 发动机型号
			CPYS         string `json:"cpys"`          // 车牌颜色
			RLLX         string `json:"rllx"`          // 燃油类型
		} `json:"data"`
		Errmsg string `json:"errmsg"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.State != 1 {
		return nil, fmt.Errorf(result.Errmsg)
	}

	return &model.ThirdPartyVehicleData{
		OSSURL:             result.Data.OSS,
		EmissionStandard:   result.Data.PFJD,
		VIN:                result.Data.VIN,
		EngineManufacturer: result.Data.MotorCompany,
		EngineModel:        result.Data.MotorXH,
		PlateColor:         result.Data.CPYS,
		FuelType:           result.Data.RLLX,
	}, nil
}

func (s *ExternalVehicleService) Create(vehicle *model.ExternalVehicle) error {
	// 校验车牌
	if err := s.ValidateLicensePlate(vehicle.LicensePlate); err != nil {
		return err
	}

	// 校验VIN
	if err := s.ValidateVIN(vehicle.VIN); err != nil {
		return err
	}

	// 校验车辆类型
	if err := s.ValidateVehicleType(vehicle.VehicleType); err != nil {
		return err
	}

	// 校验日期
	if err := s.ValidateDate(vehicle.RegisterDate); err != nil {
		return err
	}
	if err := s.ValidateDate(vehicle.IssueDate); err != nil {
		return err
	}

	// 校验必填字段
	if err := s.ValidateRequiredFields(vehicle); err != nil {
		return err
	}

	return s.repo.DB.Create(vehicle).Error
}

func (s *ExternalVehicleService) GetByID(id uint) (*model.ExternalVehicle, error) {
	var vehicle model.ExternalVehicle
	err := s.repo.DB.Preload("Company").First(&vehicle, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (s *ExternalVehicleService) List(parkID uint, licensePlate, auditStatus, dispatchStatus, emissionStandard string, page, pageSize int) ([]model.ExternalVehicle, int64, error) {
	var vehicles []model.ExternalVehicle
	var total int64

	query := s.repo.DB.Model(&model.ExternalVehicle{}).Where("park_id = ?", parkID)

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

func (s *ExternalVehicleService) Update(vehicle *model.ExternalVehicle) error {
	return s.repo.DB.Save(vehicle).Error
}

func (s *ExternalVehicleService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.ExternalVehicle{}, id).Error
}

func (s *ExternalVehicleService) Audit(id uint, status string) error {
	if status != "audited" && status != "unaudited" {
		return fmt.Errorf("invalid audit status")
	}
	return s.repo.DB.Model(&model.ExternalVehicle{}).Where("id = ?", id).Update("audit_status", status).Error
}

func (s *ExternalVehicleService) Dispatch(id uint) error {
	// 检查是否已审核
	var vehicle model.ExternalVehicle
	err := s.repo.DB.First(&vehicle, id).Error
	if err != nil {
		return err
	}

	if vehicle.AuditStatus != "audited" {
		return fmt.Errorf("车辆未审核，无法下发")
	}

	now := time.Now()
	return s.repo.DB.Model(&model.ExternalVehicle{}).Where("id = ?", id).Updates(map[string]interface{}{
		"dispatch_status": "dispatched",
		"dispatch_time":   &now,
		"dispatch_count":  gorm.Expr("dispatch_count + 1"),
	}).Error
}

func (s *ExternalVehicleService) BatchDispatch(ids []uint) error {
	// 检查所有车辆是否已审核
	var count int64
	err := s.repo.DB.Model(&model.ExternalVehicle{}).
		Where("id IN ? AND audit_status != ?", ids, "audited").
		Count(&count).Error
	if err != nil {
		return err
	}

	if count > 0 {
		return fmt.Errorf("有车辆未审核，无法下发")
	}

	now := time.Now()
	return s.repo.DB.Model(&model.ExternalVehicle{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"dispatch_status": "dispatched",
			"dispatch_time":   &now,
			"dispatch_count":  gorm.Expr("dispatch_count + 1"),
		}).Error
}
