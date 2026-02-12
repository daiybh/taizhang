
package service

import (
	"golang.org/x/crypto/bcrypt"

	"taizhang-server/internal/model"
	"taizhang-server/internal/repository"
)

type UserService struct {
	repo *repository.Repository
}

func NewUserService(repo *repository.Repository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) Create(user *model.User) error {
	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	return s.repo.DB.Create(user).Error
}

func (s *UserService) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := s.repo.DB.Preload("Role").Preload("Department").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) List(parkID uint, page, pageSize int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := s.repo.DB.Model(&model.User{}).Where("park_id = ?", parkID)

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Preload("Role").Preload("Department").Offset(offset).Limit(pageSize).Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (s *UserService) Update(user *model.User) error {
	// 如果密码不为空，则加密密码
	if user.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.Password = string(hashedPassword)
	}

	return s.repo.DB.Save(user).Error
}

func (s *UserService) Delete(id uint) error {
	return s.repo.DB.Delete(&model.User{}, id).Error
}

func (s *UserService) VerifyPassword(username, password string) (*model.User, error) {
	var user model.User
	err := s.repo.DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, err
	}

	return &user, nil
}
