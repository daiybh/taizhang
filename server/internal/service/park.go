package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type ParkService struct {
	repo *repository.Repository
}

func NewParkService(repo *repository.Repository) *ParkService {
	return &ParkService{repo: repo}
}

func (s *ParkService) Create(park *model.Park) error {
	// 生成密钥
	secretKey, err := generateSecretKey()
	if err != nil {
		return err
	}
	park.SecretKey = secretKey

	// 生成默认账号和密码
	loginAccount, loginPassword, err := generateLoginCredentials()
	if err != nil {
		return err
	}
	park.LoginAccount = loginAccount
	park.LoginPassword = loginPassword

	// 设置默认时间
	if park.StartTime.IsZero() {
		park.StartTime = time.Now()
	}
	if park.EndTime.IsZero() {
		park.EndTime = time.Now().AddDate(1, 0, 0) // 默认一年有效期
	}

	return s.repo.DB.Create(park).Error
}

func (s *ParkService) GetByID(id uint) (*model.Park, error) {
	var park model.Park
	err := s.repo.DB.First(&park, id).Error
	if err != nil {
		return nil, err
	}
	return &park, nil
}

func (s *ParkService) List(name, code string, page, pageSize int) ([]model.Park, int64, error) {
	var parks []model.Park
	var total int64

	query := s.repo.DB.Model(&model.Park{})

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

func (s *ParkService) Update(id uint, updates map[string]interface{}) error {
	// 只允许更新特定字段
	allowedFields := map[string]bool{
		"name":          true,
		"province":      true,
		"city":          true,
		"district":      true,
		"industry":      true,
		"remark":        true,
		"contact_name":  true,
		"contact_phone": true,
	}

	filteredUpdates := make(map[string]interface{})
	for field, value := range updates {
		if allowedFields[field] {
			filteredUpdates[field] = value
		}
	}

	return s.repo.DB.Model(&model.Park{}).Where("id = ?", id).Updates(filteredUpdates).Error
}

func (s *ParkService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.Park{}, id).Error
}

func (s *ParkService) Renew(id uint, duration int) (*model.Park, error) {
	var park model.Park
	err := s.repo.DB.First(&park, id).Error
	if err != nil {
		return nil, err
	}

	// 记录续费前的结束时间
	oldEndTime := park.EndTime

	// 更新结束时间
	park.EndTime = park.EndTime.AddDate(0, duration, 0)

	err = s.repo.DB.Save(&park).Error
	if err != nil {
		return nil, err
	}

	// 创建续费记录
	renewalRecord := &model.RenewalRecord{
		ParkID:      id,
		OldEndTime:  oldEndTime,
		NewEndTime:  park.EndTime,
		Duration:    duration,
		RenewalTime: time.Now(),
	}
	err = s.repo.DB.Create(renewalRecord).Error
	if err != nil {
		return nil, err
	}

	return &park, nil
}

func (s *ParkService) DownloadInfo(id uint, loginURL string) (string, error) {
	var park model.Park
	err := s.repo.DB.First(&park, id).Error
	if err != nil {
		return "", err
	}

	info := fmt.Sprintf("车场名称: %s", park.Name)
	info += fmt.Sprintf("车场编号: %s", park.Code)
	info += fmt.Sprintf("密钥: %s", park.SecretKey)
	info += fmt.Sprintf("创建时间: %d", park.CreatedAt.Unix())
	info += fmt.Sprintf("开始时间: %s", park.StartTime.Format("2006-01-02 15:04:05"))
	info += fmt.Sprintf("结束时间: %s", park.EndTime.Format("2006-01-02 15:04:05"))
	info += fmt.Sprintf("登陆网址: %s", loginURL)
	info += fmt.Sprintf("账号: %s", park.LoginAccount)
	info += fmt.Sprintf("密码: %s", park.LoginPassword)

	return info, nil
}

func (s *ParkService) CheckValidity(parkID uint) (bool, error) {
	var park model.Park
	err := s.repo.DB.First(&park, parkID).Error
	if err != nil {
		return false, err
	}

	now := time.Now()
	return park.StartTime.Before(now) && park.EndTime.After(now), nil
}

func (s *ParkService) VerifyLogin(account, password string) (*model.Park, error) {
	var park model.Park
	err := s.repo.DB.Where("login_account = ? AND login_password = ?", account, password).First(&park).Error
	if err != nil {
		return nil, err
	}

	// 检查有效期
	valid, err := s.CheckValidity(park.ID)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, fmt.Errorf("park has expired")
	}

	return &park, nil
}

// generateSecretKey 生成32位随机密钥
func generateSecretKey() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// generateLoginCredentials 生成5位数字账号和密码
func generateLoginCredentials() (string, string, error) {
	// 生成5位数字账号（10000-99999）
	accountBytes := make([]byte, 3)
	if _, err := rand.Read(accountBytes); err != nil {
		return "", "", err
	}
	// 转换为5位数字
	accountNum := 10000 + int(accountBytes[0])<<8 + int(accountBytes[1])
	accountNum = accountNum%90000 + 10000 // 确保在 10000-99999 范围内
	account := fmt.Sprintf("%05d", accountNum)

	// 生成5位数字密码（10000-99999）
	passwordBytes := make([]byte, 3)
	if _, err := rand.Read(passwordBytes); err != nil {
		return "", "", err
	}
	passwordNum := 10000 + int(passwordBytes[0])<<8 + int(passwordBytes[1])
	passwordNum = passwordNum%90000 + 10000 // 确保在 10000-99999 范围内
	password := fmt.Sprintf("%05d", passwordNum)

	return account, password, nil
}
