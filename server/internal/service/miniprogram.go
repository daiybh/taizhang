package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"taizhang-server/internal/config"
	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type MiniProgramService struct {
	repo *repository.Repository
	cfg  *config.Config
}

func NewMiniProgramService(repo *repository.Repository, cfg *config.Config) *MiniProgramService {
	return &MiniProgramService{
		repo: repo,
		cfg:  cfg,
	}
}

// Scan 扫码处理
func (s *MiniProgramService) Scan(qrcode string) (*model.ScanResult, error) {
	// 解析二维码获取车场ID
	parkID, err := s.parseQRCode(qrcode)
	if err != nil {
		return nil, err
	}

	// 检查车场有效期
	var park model.Park
	err = s.repo.DB.First(&park, parkID).Error
	if err != nil {
		return nil, err
	}

	now := time.Now()
	if park.StartTime.After(now) || park.EndTime.Before(now) {
		return nil, fmt.Errorf("车场已过期")
	}

	// 检查是否启用公司管理
	companyEnabled := s.isCompanyEnabled(parkID)

	// 获取公司列表
	var companies []model.Company
	if companyEnabled {
		err = s.repo.DB.Where("park_id = ?", parkID).Find(&companies).Error
		if err != nil {
			return nil, err
		}
	}

	return &model.ScanResult{
		ParkID:         parkID,
		ParkName:       park.Name,
		CompanyEnabled: companyEnabled,
		Companies:      companies,
	}, nil
}

// GetCarData 获取第三方随车清单数据
func (s *MiniProgramService) GetCarData(plate, vin, engineNumber, vehicleType string) (*model.ThirdPartyVehicleData, error) {
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

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
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

	if err := json.Unmarshal(body, &result); err != nil {
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

// 辅助函数
func (s *MiniProgramService) parseQRCode(qrcode string) (uint, error) {
	// 解析二维码获取车场ID
	// 这里需要根据实际的二维码格式进行解析
	// 示例: qrcode = "park:12345"
	var parkID uint
	_, err := fmt.Sscanf(qrcode, "park:%d", &parkID)
	if err != nil {
		return 0, fmt.Errorf("invalid qrcode format")
	}
	return parkID, nil
}

func (s *MiniProgramService) isCompanyEnabled(parkID uint) bool {
	// 检查车场是否启用公司管理
	// 这里需要根据实际业务逻辑实现
	// 示例: 检查车场配置
	return false
}

// SubmitVehicle 提交车辆信息
func (s *MiniProgramService) SubmitVehicle(vehicle *model.ExternalVehicle) error {
	// 校验车牌
	if err := s.validateLicensePlate(vehicle.LicensePlate); err != nil {
		return err
	}

	// 确定车牌颜色
	vehicle.PlateColor = s.determinePlateColor(vehicle.LicensePlate, vehicle.VehicleType)

	// 校验VIN
	if err := s.validateVIN(vehicle.VIN); err != nil {
		return err
	}

	// 校验车辆类型
	if err := s.validateVehicleType(vehicle.VehicleType); err != nil {
		return err
	}

	// 校验日期
	if err := s.validateDate(vehicle.RegisterDate); err != nil {
		return err
	}
	if err := s.validateDate(vehicle.IssueDate); err != nil {
		return err
	}

	// 校验必填字段
	if err := s.validateRequiredFields(vehicle); err != nil {
		return err
	}

	return s.repo.DB.Create(vehicle).Error
}

// 辅助函数
func (s *MiniProgramService) validateLicensePlate(plate string) error {
	// 校验车牌位数在7位、8位且第二位字符必须是A-Z的字母
	if len(plate) != 7 && len(plate) != 8 {
		return fmt.Errorf("车牌号码位数不正确")
	}

	// 第二位字符必须是A-Z的字母
	if len(plate) < 2 || !isLetter(plate[1]) {
		return fmt.Errorf("车牌号码格式不正确，第二位必须是A-Z的字母")
	}

	return nil
}

func (s *MiniProgramService) determinePlateColor(plate string, vehicleType string) string {
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
	if plateLen == 7 && (contains(vehicleType, "重型") || contains(vehicleType, "中型")) {
		return "黄牌"
	}

	// 4.4 ocr车牌号码位数=7，且车辆类型包含：轻型，车牌颜色=蓝牌
	if plateLen == 7 && contains(vehicleType, "轻型") {
		return "蓝牌"
	}

	// 4.5 else 车牌颜色=蓝牌
	return "蓝牌"
}

func (s *MiniProgramService) validateVIN(vin string) error {
	if len(vin) != 17 {
		return fmt.Errorf("车辆识别代号必须是17位")
	}
	return nil
}

func (s *MiniProgramService) validateVehicleType(vehicleType string) error {
	// 车辆类型最后一位字符必须是"车"
	if len(vehicleType) == 0 || vehicleType[len(vehicleType)-1:] != "车" {
		return fmt.Errorf("车辆类型错误，最后一位必须是'车'")
	}
	return nil
}

func (s *MiniProgramService) validateDate(dateStr string) error {
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

func (s *MiniProgramService) validateRequiredFields(vehicle *model.ExternalVehicle) error {
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

func isLetter(c byte) bool {
	return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
}

func isDigit(c byte) bool {
	return c >= '0' && c <= '9'
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}
