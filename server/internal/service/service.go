package service

import (
	"taizhang-server/internal/config"
	"taizhang-server/internal/repository"
)

type Services struct {
	Park            *ParkService
	Renewal         *RenewalService
	Company         *CompanyService
	QRCode          *QRCodeService
	ExternalVehicle *ExternalVehicleService
	InternalVehicle *InternalVehicleService
	NonRoad         *NonRoadService
	User            *UserService
	Role            *RoleService
	Department      *DepartmentService
	MiniProgram     *MiniProgramService
	Plugin          *PluginService
}

func New(repos *repository.Repository, cfg *config.Config) *Services {
	return &Services{
		Park:            NewParkService(repos),
		Renewal:         NewRenewalService(repos),
		Company:         NewCompanyService(repos),
		QRCode:          NewQRCodeService(repos),
		ExternalVehicle: NewExternalVehicleService(repos, cfg),
		InternalVehicle: NewInternalVehicleService(repos),
		NonRoad:         NewNonRoadService(repos),
		User:            NewUserService(repos),
		Role:            NewRoleService(repos),
		Department:      NewDepartmentService(repos),
		MiniProgram:     NewMiniProgramService(repos, cfg),
		Plugin:          NewPluginService(repos),
	}
}
