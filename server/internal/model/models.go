package model

import (
	"time"
)

// Park 车场模型
type Park struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"type:varchar(100);not null" json:"name"`
	Code          string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	SecretKey     string    `gorm:"type:varchar(32);not null" json:"secret_key"`
	StartTime     time.Time `json:"start_time"`
	EndTime       time.Time `json:"end_time"`
	Province      string    `gorm:"type:varchar(50)" json:"province"`
	City          string    `gorm:"type:varchar(50)" json:"city"`
	District      string    `gorm:"type:varchar(50)" json:"district"`
	Industry      string    `gorm:"type:varchar(50)" json:"industry"`
	Remark        string    `gorm:"type:text" json:"remark"`
	ContactName   string    `gorm:"type:varchar(50)" json:"contact_name"`
	ContactPhone  string    `gorm:"type:varchar(20)" json:"contact_phone"`
	LoginAccount  string    `gorm:"type:varchar(5);not null" json:"login_account"`
	LoginPassword string    `gorm:"type:varchar(5);not null" json:"login_password"` // 5位数字密码（明文存储）
	LoginURL      string    `gorm:"type:varchar(200)" json:"login_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// RenewalRecord 续费记录
type RenewalRecord struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ParkID      uint      `gorm:"not null;index" json:"park_id"`
	Park        Park      `gorm:"foreignKey:ParkID" json:"park,omitempty"`
	OldEndTime  time.Time `json:"old_end_time"`
	NewEndTime  time.Time `json:"new_end_time"`
	Duration    int       `json:"duration"` // 续费时长（月）
	RenewalTime time.Time `json:"renewal_time"`
	CreatedAt   time.Time `json:"created_at"`
}

// Company 公司模型
type Company struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ParkID       uint      `gorm:"not null;index" json:"park_id"`
	Park         Park      `gorm:"foreignKey:ParkID" json:"park,omitempty"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	ContactName  string    `gorm:"type:varchar(50)" json:"contact_name"`
	ContactPhone string    `gorm:"type:varchar(20)" json:"contact_phone"`
	Remark       string    `gorm:"type:text" json:"remark"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// QRCode 二维码配置
type QRCode struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ParkID       uint      `gorm:"not null;index" json:"park_id"`
	Park         Park      `gorm:"foreignKey:ParkID" json:"park,omitempty"`
	Type         string    `gorm:"type:varchar(20);not null" json:"type"` // external-vehicle, internal-vehicle, non-road
	Content      string    `gorm:"type:text;not null" json:"content"`
	IsEnabled    bool      `gorm:"default:true" json:"is_enabled"`
	FieldsConfig string    `gorm:"type:json" json:"fields_config"` // 字段配置JSON
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ExternalVehicle 厂外运输车辆
type ExternalVehicle struct {
	ID        uint     `gorm:"primaryKey" json:"id"`
	ParkID    uint     `gorm:"not null;index" json:"park_id"`
	CompanyID *uint    `json:"company_id"`
	Company   *Company `gorm:"foreignKey:CompanyID" json:"company,omitempty"`

	// 基本信息
	LicensePlate     string `gorm:"type:varchar(20);index" json:"license_plate"`
	PlateColor       string `gorm:"type:varchar(20)" json:"plate_color"`
	VehicleType      string `gorm:"type:varchar(50)" json:"vehicle_type"`
	VIN              string `gorm:"type:varchar(17);index" json:"vin"`
	RegisterDate     string `gorm:"type:varchar(20)" json:"register_date"`
	BrandModel       string `gorm:"type:varchar(100)" json:"brand_model"`
	FuelType         string `gorm:"type:varchar(20)" json:"fuel_type"`
	EmissionStandard string `gorm:"type:varchar(20)" json:"emission_standard"`
	UsageNature      string `gorm:"type:varchar(50)" json:"usage_nature"`

	// 发动机信息
	EngineNumber       string `gorm:"type:varchar(50)" json:"engine_number"`
	EngineModel        string `gorm:"type:varchar(50)" json:"engine_model"`
	EngineManufacturer string `gorm:"type:varchar(100)" json:"engine_manufacturer"`

	// 质量信息
	TotalMass        *float64 `json:"total_mass"`
	CurbMass         *float64 `json:"curb_mass"`
	ApprovedLoadMass *float64 `json:"approved_load_mass"`
	MaxTowingMass    *float64 `json:"max_towing_mass"`

	// 其他信息
	Phone        string `gorm:"type:varchar(20)" json:"phone"`
	IsOBDEnabled bool   `gorm:"default:true" json:"is_obd_enabled"`
	Address      string `gorm:"type:varchar(200)" json:"address"`
	IssueDate    string `gorm:"type:varchar(20)" json:"issue_date"`
	Owner        string `gorm:"type:varchar(100)" json:"owner"`
	// 运输信息
	FleetName           string   `gorm:"type:varchar(100)" json:"fleet_name"`
	InboundCargoName    string   `gorm:"type:varchar(100)" json:"inbound_cargo_name"`
	InboundCargoWeight  *float64 `json:"inbound_cargo_weight"`
	OutboundCargoName   string   `gorm:"type:varchar(100)" json:"outbound_cargo_name"`
	OutboundCargoWeight *float64 `json:"outbound_cargo_weight"`

	// 照片
	VehiclePhoto        string `gorm:"type:varchar(500)" json:"vehicle_photo"`
	DrivingLicensePhoto string `gorm:"type:varchar(500)" json:"driving_license_photo"`
	VehicleListPhoto    string `gorm:"type:varchar(500)" json:"vehicle_list_photo"`

	// 审核与下发
	AuditStatus    string     `gorm:"type:varchar(20);default:'unaudited'" json:"audit_status"`       // audited, unaudited
	DispatchStatus string     `gorm:"type:varchar(20);default:'undispatched'" json:"dispatch_status"` // dispatched, undispatched
	NetworkStatus  string     `gorm:"type:varchar(20)" json:"network_status"`
	DispatchCount  int        `gorm:"default:0" json:"dispatch_count"`
	DispatchTime   *time.Time `json:"dispatch_time"`

	// 版本控制（乐观锁）
	Version   int       `gorm:"default:0" json:"version"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// InternalVehicle 厂内运输车辆
type InternalVehicle struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	ParkID uint `gorm:"not null;index" json:"park_id"`

	// 基本信息
	EnvironmentalCode string `gorm:"type:varchar(50);index" json:"environmental_code"`
	VIN               string `gorm:"type:varchar(17);index" json:"vin"`
	ProductionDate    string `gorm:"type:varchar(20)" json:"production_date"`
	LicensePlate      string `gorm:"type:varchar(20);index" json:"license_plate"`
	RegisterDate      string `gorm:"type:varchar(20)" json:"register_date"`
	BrandModel        string `gorm:"type:varchar(100)" json:"brand_model"`
	FuelType          string `gorm:"type:varchar(20)" json:"fuel_type"`
	EmissionStandard  string `gorm:"type:varchar(20)" json:"emission_standard"`
	UsageNature       string `gorm:"type:varchar(50)" json:"usage_nature"`
	Owner             string `gorm:"type:varchar(100)" json:"owner"`
	VehicleType       string `gorm:"type:varchar(50)" json:"vehicle_type"`
	PlateColor        string `gorm:"type:varchar(20)" json:"plate_color"`

	// 发动机信息
	EngineNumber           string `gorm:"type:varchar(50)" json:"engine_number"`
	LocalEnvironmentalCode string `gorm:"type:varchar(50)" json:"local_environmental_code"`

	// 质量信息
	ApprovedLoadMass *float64 `json:"approved_load_mass"`
	MaxTowingMass    *float64 `json:"max_towing_mass"`

	// 其他信息
	Address   string `gorm:"type:varchar(200)" json:"address"`
	IssueDate string `gorm:"type:varchar(20)" json:"issue_date"`

	// 照片
	VehicleListPhoto    string `gorm:"type:varchar(500)" json:"vehicle_list_photo"`
	DrivingLicensePhoto string `gorm:"type:varchar(500)" json:"driving_license_photo"`
	VehiclePhoto        string `gorm:"type:varchar(500)" json:"vehicle_photo"`

	// 联网与下发
	NetworkStatus  string     `gorm:"type:varchar(20)" json:"network_status"`
	DispatchStatus string     `gorm:"type:varchar(20);default:'undispatched'" json:"dispatch_status"`
	DispatchTime   *time.Time `json:"dispatch_time"`

	// 版本控制（乐观锁）
	Version   int       `gorm:"default:0" json:"version"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NonRoadMachinery 非道路移动机械
type NonRoadMachinery struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	ParkID uint `gorm:"not null;index" json:"park_id"`

	// 基本信息
	EnvironmentalCode string `gorm:"type:varchar(50);index" json:"environmental_code"`
	ProductionDate    string `gorm:"type:varchar(20)" json:"production_date"`
	LicensePlate      string `gorm:"type:varchar(20);index" json:"license_plate"`
	EmissionStandard  string `gorm:"type:varchar(20)" json:"emission_standard"`
	FuelType          string `gorm:"type:varchar(20)" json:"fuel_type"`
	MachineryType     string `gorm:"type:varchar(50)" json:"machinery_type"`
	PIN               string `gorm:"type:varchar(50);index" json:"pin"` // 机械环保代码/产品识别码
	MachineryModel    string `gorm:"type:varchar(100)" json:"machinery_model"`

	// 发动机信息
	EngineModel        string   `gorm:"type:varchar(50)" json:"engine_model"`
	EngineManufacturer string   `gorm:"type:varchar(100)" json:"engine_manufacturer"`
	EngineNumber       string   `gorm:"type:varchar(50)" json:"engine_number"`
	EnginePower        *float64 `json:"engine_power"` // kW

	// 其他信息
	Owner                   string `gorm:"type:varchar(100)" json:"owner"`
	EnvironmentalInfoNumber string `gorm:"type:varchar(50)" json:"environmental_info_number"`
	RegisterDate            string `gorm:"type:varchar(20)" json:"register_date"`
	MachineryManufacturer   string `gorm:"type:varchar(100)" json:"machinery_manufacturer"`
	LocalEnvironmentalCode  string `gorm:"type:varchar(50)" json:"local_environmental_code"`
	EntryDate               string `gorm:"type:varchar(20)" json:"entry_date"`

	// 照片
	WholeMachinePhoto       string `gorm:"type:varchar(500)" json:"whole_machine_photo"`       // 整车(机)铭牌
	EngineNameplatePhoto    string `gorm:"type:varchar(500)" json:"engine_nameplate_photo"`    // 发动机铭牌
	EnvironmentalLabelPhoto string `gorm:"type:varchar(500)" json:"environmental_label_photo"` // 机械环保信息标
	DevicePhoto             string `gorm:"type:varchar(500)" json:"device_photo"`              // 设备照片

	// 下发
	DispatchStatus string     `gorm:"type:varchar(20);default:'undispatched'" json:"dispatch_status"`
	DispatchTime   *time.Time `json:"dispatch_time"`

	// 版本控制（乐观锁）
	Version   int       `gorm:"default:0" json:"version"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User 用户模型
type User struct {
	ID           uint  `gorm:"primaryKey" json:"id"`
	ParkID       uint  `gorm:"not null;index" json:"park_id"`
	RoleID       uint  `gorm:"not null;index" json:"role_id"`
	DepartmentID *uint `json:"department_id"`

	Username string `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Password string `gorm:"type:varchar(100);not null" json:"-"`
	Name     string `gorm:"type:varchar(50)" json:"name"`
	Phone    string `gorm:"type:varchar(20)" json:"phone"`
	Email    string `gorm:"type:varchar(100)" json:"email"`

	Role       Role        `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Role 角色模型
type Role struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ParkID      uint   `gorm:"not null;index" json:"park_id"`
	Name        string `gorm:"type:varchar(50);not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	// 权限配置
	Permissions string `gorm:"type:json" json:"permissions"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Department 部门模型
type Department struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ParkID      uint   `gorm:"not null;index" json:"park_id"`
	Name        string `gorm:"type:varchar(50);not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PluginAuth PC端插件认证
type PluginAuth struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ParkID    uint      `gorm:"not null;index" json:"park_id"`
	Token     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// ScanResult 扫码结果
type ScanResult struct {
	ParkID         uint      `json:"park_id"`
	ParkName       string    `json:"park_name"`
	CompanyEnabled bool      `json:"company_enabled"`
	Companies      []Company `json:"companies"`
}

// ThirdPartyVehicleData 第三方随车清单数据
type ThirdPartyVehicleData struct {
	OSSURL             string `json:"oss_url"`
	EmissionStandard   string `json:"emission_standard"`
	VIN                string `json:"vin"`
	EngineManufacturer string `json:"engine_manufacturer"`
	EngineModel        string `json:"engine_model"`
	PlateColor         string `json:"plate_color"`
	FuelType           string `json:"fuel_type"`
}
